import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DailyTask } from '../models/daily-task.model';
import { DailyTaskService } from '../services/daily-task.service';
import { AuthService } from '../../front-office/pages/login/auth.service';

@Component({
  selector: 'app-daily-task-list',
  templateUrl: './daily-task-list.component.html',
  styleUrls: ['./daily-task-list.component.css']
})
export class DailyTaskListComponent implements OnInit, OnDestroy {
  tasks: DailyTask[] = [];
  private sub = new Subscription();

  isModalOpen = false;
  isEditing = false;

  currentTask: DailyTask = this.emptyTask();
  private patientId: string = '';

  // ✅ Search + filter + sort
  searchTerm: string = '';
  filterType: string = 'ALL';     // ALL or MEDICATION/MEAL...
  filterStatus: string = 'ALL';   // ALL / DONE / TODO
  sortMode: string = 'TIME';      // TIME / TITLE / TYPE

  constructor(
    private taskService: DailyTaskService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.auth.currentUser$.subscribe((u: any) => {
        this.patientId = String(u?.userId || '');

        if (this.patientId && this.patientId.trim() !== '') {
          this.load();
        } else {
          console.warn('Warning: No Patient ID received from AuthService');
          this.tasks = [];
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  load(): void {
    if (!this.patientId) {
      this.tasks = [];
      return;
    }

    this.sub.add(
      this.taskService.getTasksByPatient(this.patientId).subscribe({
        next: (data) => (this.tasks = data || []),
        error: (err) => {
          console.error('Load tasks failed:', err);
          this.tasks = [];
        }
      })
    );
  }

  // progress
  get completedCount(): number {
    let c = 0;
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].completed) c++;
    }
    return c;
  }

  get totalCount(): number {
    return this.tasks.length;
  }

  get progressPercent(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  // ✅ Displayed list after search/filter/sort
  get displayedTasks(): DailyTask[] {
    let list: DailyTask[] = this.tasks.slice();

    // search
    const q = this.normalizeKey(this.searchTerm);
    if (q) {
      list = list.filter((t: DailyTask) => {
        const inTitle = this.normalizeKey(t.title).includes(q);
        const inNotes = this.normalizeKey(t.notes || '').includes(q);
        return inTitle || inNotes;
      });
    }

    // filter type
    if (this.filterType !== 'ALL') {
      list = list.filter((t: DailyTask) => t.taskType === this.filterType);
    }

    // filter status
    if (this.filterStatus === 'DONE') {
      list = list.filter((t: DailyTask) => !!t.completed);
    } else if (this.filterStatus === 'TODO') {
      list = list.filter((t: DailyTask) => !t.completed);
    }

    // sort
    if (this.sortMode === 'TIME') {
      list.sort((a: DailyTask, b: DailyTask) =>
        this.normalizeTime(a.scheduledTime).localeCompare(this.normalizeTime(b.scheduledTime))
      );
    } else if (this.sortMode === 'TITLE') {
      list.sort((a: DailyTask, b: DailyTask) =>
        this.normalizeKey(a.title).localeCompare(this.normalizeKey(b.title))
      );
    } else if (this.sortMode === 'TYPE') {
      list.sort((a: DailyTask, b: DailyTask) =>
        (a.taskType || '').localeCompare(b.taskType || '')
      );
    }

    return list;
  }

  // UI actions
  openAdd(): void {
    this.isEditing = false;
    this.currentTask = this.emptyTask();
    this.isModalOpen = true;
  }

  openEdit(task: DailyTask): void {
    this.isEditing = true;
    this.currentTask = { ...task };
    this.currentTask.scheduledTime = this.normalizeTime(this.currentTask.scheduledTime);
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  private normalizeTime(time: string): string {
    if (!time) return '08:00';

    // already HH:mm
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return time;

    // convert "08:00 AM" / "8:00 PM" => "08:00" / "20:00"
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const modifier = (match[3] || '').toUpperCase();

      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return '08:00';
  }

  private normalizeKey(s: string): string {
    return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // ✅ Unicité check: same patient + same (title+type+time)
  private isDuplicate(payload: DailyTask): boolean {
    const titleKey = this.normalizeKey(payload.title);
    const timeKey = this.normalizeTime(payload.scheduledTime);
    const typeKey = (payload.taskType || 'OTHER').toString();

    for (let i = 0; i < this.tasks.length; i++) {
      const t = this.tasks[i];

      // ignore same task when editing
      if (payload.id && t.id && Number(t.id) === Number(payload.id)) continue;

      const tTitleKey = this.normalizeKey(t.title);
      const tTimeKey = this.normalizeTime(t.scheduledTime);
      const tTypeKey = (t.taskType || 'OTHER').toString();

      if (
        t.patientId === payload.patientId &&
        tTitleKey === titleKey &&
        tTypeKey === typeKey &&
        tTimeKey === timeKey
      ) {
        return true;
      }
    }
    return false;
  }

  save(): void {
    if (!this.patientId) {
      alert('CRITICAL ERROR: No Patient ID found.');
      return;
    }

    if (!this.currentTask.title || this.currentTask.title.trim() === '') {
      alert('Please enter a title.');
      return;
    }

    const payload: DailyTask = {
      ...this.currentTask,
      patientId: this.patientId,
      scheduledTime: this.normalizeTime(this.currentTask.scheduledTime),
      completed: !!this.currentTask.completed
    };

    // ✅ prevent duplicates
    if (this.isDuplicate(payload)) {
      alert('This task already exists (same title + type + time).');
      return;
    }

    if (this.isEditing && payload.id) {
      this.sub.add(
        this.taskService.updateTask(payload).subscribe({
          next: () => {
            this.closeModal();
            this.load();
          },
          error: (err) => {
            console.error('Update failed:', err);
            alert(
              `Update failed (${err.status}) : ` +
              (typeof err.error === 'string' ? err.error : JSON.stringify(err.error))
            );
          }
        })
      );
    } else {
      this.sub.add(
        this.taskService.addTask(payload).subscribe({
          next: () => {
            this.closeModal();
            this.load();
          },
          error: (err) => {
            console.error('Add failed:', err);
            alert(
              `Add failed (${err.status}) : ` +
              (typeof err.error === 'string' ? err.error : JSON.stringify(err.error))
            );
          }
        })
      );
    }
  }

  trackByTaskId(index: number, task: DailyTask) {
    return task.id;
  }

  remove(task: DailyTask): void {
    if (task.id == null) return;
    const id = Number(task.id);

    // ✅ remove instantly
    this.tasks = this.tasks.filter((t: DailyTask) => Number(t.id) !== id);

    this.sub.add(
      this.taskService.deleteTask(id).subscribe({
        next: () => {},
        error: (err) => {
          console.error('Delete request error (but maybe deleted):', err);
          this.load();
          alert('Delete request had an issue, refreshing the list...');
        }
      })
    );
  }

  toggle(task: DailyTask): void {
    if (!task.id) return;

    const newValue = !task.completed;
    task.completed = newValue;

    this.sub.add(
      this.taskService.setCompleted(task.id, newValue).subscribe({
        next: () => this.load(),
        error: (err) => {
          console.error('Toggle failed', err);
          task.completed = !newValue;
        }
      })
    );
  }

  private emptyTask(): DailyTask {
    return {
      patientId: '',
      title: '',
      taskType: 'OTHER',
      scheduledTime: '08:00',
      notes: '',
      completed: false
    };
  }
}