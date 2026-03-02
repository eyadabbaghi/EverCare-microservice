import { Component, HostListener, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService, User } from '../../pages/login/auth.service';
import { NotificationService, Notification as ActivityNotification } from '../../../../core/services/notification.service';

interface NavItem {
  id: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-front-office-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
})
export class NavigationComponent implements OnInit, OnDestroy {
  // Navigation items including 'communication'
  navItems: NavItem[] = [
    { id: 'home', label: 'Home', route: '/' },
    { id: 'activities', label: 'Activities', route: '/activities' },
    { id: 'appointments', label: 'Appointments', route: '/appointments' },
    { id: 'medical-folder', label: 'Medical Folder', route: '/medical-folder' },
    { id: 'alerts', label: 'Alerts', route: '/alerts' },
    { id: 'communication', label: 'Messages', route: '/communication' },
  ];

  user: User | null = null;
  private userSub!: Subscription;
  private pollingSub!: Subscription;

  isMobileMenuOpen = false;
  notificationsOpen = false;
  profileOpen = false;

  // Activity notifications fetched from the microservice, enriched with local read flag
  activityNotifications: (ActivityNotification & { read: boolean })[] = [];

  constructor(
    private readonly router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe((user: User | null) => {
      this.user = user;
    });

    // If token exists but user is null, try to fetch user (only in browser)
    if (isPlatformBrowser(this.platformId) && this.authService.getToken() && !this.user) {
      this.authService.fetchCurrentUser().subscribe({
        next: (user) => console.log('Fetched user on navigation init:', user),
        error: (err) => console.error('Failed to fetch user on init', err)
      });
    }

    // Only run HTTP calls and polling in the browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      // Fetch immediately on init
      this.notificationService.getNotifications().subscribe({
        next: (data) => {
          this.activityNotifications = data.map(n => ({ ...n, read: false }));
        },
        error: (err) => console.error('Initial notification fetch failed', err)
      });

      // Start polling for activity notifications every 30 seconds
      this.pollingSub = interval(30000)
        .pipe(switchMap(() => this.notificationService.getNotifications()))
        .subscribe({
          next: (fetched) => {
            // Merge with existing to preserve read status
            const existingMap = new Map(this.activityNotifications.map(n => [n.id, n]));
            this.activityNotifications = fetched.map(n => ({
              ...n,
              read: existingMap.get(n.id)?.read ?? false
            }));
          },
          error: (err) => console.error('Failed to fetch notifications', err)
        });
    }
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
    if (this.pollingSub) this.pollingSub.unsubscribe();
  }

  // Notifications for display (only activity notifications)
  get displayNotifications(): (ActivityNotification & { read: boolean })[] {
    return this.activityNotifications;
  }

  get unreadCount(): number {
    return this.activityNotifications.filter(n => !n.read).length;
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  navigate(route: string): void {
    // Protected routes that require authentication
    const protectedRoutes = [
      '/medical-folder', '/alerts',
      '/profile', '/messages', '/daily', '/blog', '/appointments', '/communication'
    ];

    if (protectedRoutes.includes(route) && !this.user) {
      this.router.navigateByUrl('/login');
    } else {
      this.router.navigateByUrl(route);
    }
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  openAlerts(): void {
    this.notificationsOpen = !this.notificationsOpen;
  }

  toggleProfileMenu(): void {
    this.profileOpen = !this.profileOpen;
  }

  markAsRead(id: string): void {
    this.activityNotifications = this.activityNotifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
  }

  markAllAsRead(): void {
    this.activityNotifications = this.activityNotifications.map(n => ({ ...n, read: true }));
  }

  handleNotificationClick(notification: ActivityNotification & { read: boolean }): void {
    this.markAsRead(notification.id);


  }

  // Helper for activity notification icon
  getActivityIcon(action: string): string {
    switch (action) {
      case 'CREATED': return '🆕';
      case 'UPDATED': return '✏️';
      case 'DELETED': return '🗑️';
      default: return '📢';
    }
  }

  // Helper for activity notification title
  getActivityTitle(action: string): string {
    switch (action) {
      case 'CREATED': return 'New activity available';
      case 'UPDATED': return 'Activity updated';
      case 'DELETED': return 'Activity removed';
      default: return 'Activity notification';
    }
  }

  getSeverityClasses(severity?: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-[#C06C84] text-white';
      case 'HIGH': return 'bg-[#B39DDB] text-white';
      case 'MEDIUM': return 'bg-[#DCCEF9] text-[#7C3AED]';
      case 'LOW': return 'bg-[#A8E6CF] text-[#22c55e]';
      default: return '';
    }
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.profileOpen = false;
  }

  goToProfile(): void {
    this.profileOpen = false;
    this.navigate('/profile');
  }

  clearAllNotifications(): void {
    this.activityNotifications = []; // clear all activity notifications
    // Optionally, you could also call a backend endpoint to delete them
    // this.notificationService.deleteAll().subscribe(...);
  }

  /** =======================
   *  Close dropdown when clicking outside
   *  ======================= */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = document.getElementById('profile-dropdown');
    const button = document.getElementById('profile-button');

    if (dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
      this.profileOpen = false;
    }
  }
}
