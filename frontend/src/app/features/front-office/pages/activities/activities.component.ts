import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ActivityService, Activity } from '../../../../core/services/activity.service';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css'],
})
export class ActivitiesComponent implements OnInit {
  allActivities: Activity[] = [];

  // Filter properties
  searchTerm: string = '';
  selectedType: string = 'all';

  // Available filter options
  types: string[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 1;

  // Filtered list for display
  private filteredActivities: Activity[] = [];

  constructor(
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.activityService.getPublicActivities().subscribe({
      next: (data) => {
        this.allActivities = data;
        this.types = [...new Set(data.map(a => a.type))];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load activities', err);
        this.toastr.error('Could not load activities');
      }
    });
  }

  applyFilters(): void {
    let filtered = this.allActivities;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term)
      );
    }

    if (this.selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === this.selectedType);
    }

    this.filteredActivities = filtered;
    this.currentPage = 1;
    this.totalPages = Math.max(1, Math.ceil(this.filteredActivities.length / this.pageSize));
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = 'all';
    this.applyFilters();
  }

  // Getter for current page items
  get pagedActivities(): Activity[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredActivities.slice(start, start + this.pageSize);
  }

  viewDetails(activity: Activity): void {
    this.router.navigate(['/activities', activity.id]);
  }

  // Pagination methods
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
