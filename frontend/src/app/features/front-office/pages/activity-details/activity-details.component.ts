import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ActivityService, ActivityWithDetails } from '../../../../core/services/activity.service';

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.css'],
})
export class ActivityDetailsComponent implements OnInit {
  activity: ActivityWithDetails | null = null;
  Math = Math;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private readonly activityService: ActivityService,
  ) {}

  ngOnInit(): void {
    const activityId = this.route.snapshot.paramMap.get('id');
    if (!activityId) {
      this.router.navigate(['/activities']);
      return;
    }
    this.loadActivity(activityId);
  }

  loadActivity(activityId: string): void {
    this.activityService.getPublicActivityById(activityId).subscribe({
      next: (data) => {
        this.activity = data;
      },
      error: (err) => {
        console.error('Failed to load activity', err);
        this.toastr.error('Activity not found');
        this.router.navigate(['/activities']);
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/activities']);
  }
}
