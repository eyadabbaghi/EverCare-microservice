import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BlogService } from '../../../blog/pages/blog/services/blog.service';
import { Article, Category, CategoryPerformance } from '../../../blog/models/blog.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-blog-admin',
  templateUrl: './blog-admin.component.html'
})
export class BlogAdminComponent implements OnInit, OnDestroy {
  articles: Article[] = [];
  categories: Category[] = [];
  categoryStats: CategoryPerformance[] = [];

  newCatName: string = '';
  showCatInput: boolean = false;
  showModal: boolean = false;
  isEditMode: boolean = false;
  currentArticleId: number | null = null;
  newArticle: any = this.initEmptyArticle();

  private pollingSubscription?: Subscription;

  constructor(
    private blogService: BlogService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.refreshData();
    // Le polling est facultatif ; il peut être réactivé plus tard
    // if (isPlatformBrowser(this.platformId)) {
    //   this.startRealTimeUpdate();
    // }
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) this.pollingSubscription.unsubscribe();
  }

  startRealTimeUpdate(): void {
    this.pollingSubscription = interval(10000).subscribe(() => {
      this.blogService.getAllArticles().subscribe(data => this.syncCounters(data));
      this.blogService.getCategoryPerformance().subscribe(stats => {
        this.categoryStats = stats;
        this.cdr.markForCheck();
      });
    });
  }

  private syncCounters(serverArticles: Article[]): void {
    serverArticles.forEach(serverArt => {
      const localArt = this.articles.find(a => a.id === serverArt.id);
      if (localArt) {
        localArt.likeCount = serverArt.likeCount;
        localArt.viewCount = serverArt.viewCount;
      }
    });
    this.cdr.markForCheck();
  }

  refreshData() {
    this.blogService.getAllArticles().subscribe(data => {
      this.articles = [...data];
      this.cdr.markForCheck();
    });
    this.blogService.getAllCategories().subscribe(data => {
      this.categories = [...data];
      this.cdr.markForCheck();
    });
    this.blogService.getCategoryPerformance().subscribe(stats => {
      this.categoryStats = stats;
      this.cdr.markForCheck();
    });
  }

  getArticlesCountByCategory(categoryId: number): number {
    return this.articles.filter(a => a.category?.id === categoryId).length;
  }

  // ---- Optimistic update pour suppression d'article ----
  deleteArticle(id: number | undefined) {
    if (!id) return;
    if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;
    const deletedArticle = this.articles.find(a => a.id === id);
    this.articles = this.articles.filter(a => a.id !== id);
    this.cdr.detectChanges();

    this.blogService.deleteArticle(id).subscribe({
      error: (err) => {
        // Restauration en cas d'erreur
        if (deletedArticle) this.articles = [...this.articles, deletedArticle];
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  // ---- Optimistic update pour ajout de catégorie ----
  addCategory() {
    if (!this.newCatName.trim()) return;
    const tempId = Date.now();
    const newCategory: Category = {
      id: tempId,
      name: this.newCatName,
      description: '',
      totalArticles: 0,
      viewCount: 0
    };
    this.categories = [...this.categories, newCategory];
    this.cdr.detectChanges();

    this.blogService.addCategory({ name: this.newCatName } as Category).subscribe({
      next: (created) => {
        this.categories = this.categories.map(c => c.id === tempId ? created : c);
        this.cdr.detectChanges();
        this.refreshData(); // pour mettre à jour les compteurs/stats si besoin
      },
      error: (err) => {
        this.categories = this.categories.filter(c => c.id !== tempId);
        this.cdr.detectChanges();
        console.error(err);
      }
    });
    this.newCatName = '';
    this.showCatInput = false;
  }

  // ---- Optimistic update pour suppression de catégorie ----
  deleteCategory(id: number) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const deletedCat = this.categories.find(c => c.id === id);
    this.categories = this.categories.filter(c => c.id !== id);
    this.cdr.detectChanges();

    this.blogService.deleteCategory(id).subscribe({
      error: (err) => {
        if (deletedCat) this.categories = [...this.categories, deletedCat];
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  private initEmptyArticle() {
    return { title: '', content: '', coverImageUrl: '', language: 'fr', readingTime: 5, categoryId: null, isPublished: true };
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentArticleId = null;
    this.newArticle = this.initEmptyArticle();
    this.showModal = true;
  }

  openEditModal(article: Article) {
    this.isEditMode = true;
    this.currentArticleId = article.id || null;
    this.newArticle = {
      title: article.title,
      content: article.content,
      coverImageUrl: article.coverImageUrl,
      language: article.language,
      readingTime: article.readingTime,
      categoryId: article.category?.id,
      isPublished: article.isPublished
    };
    this.showModal = true;
  }

  // ---- Optimistic update pour création / modification d'article ----
  handleSave() {
    if (!this.newArticle.categoryId) return alert("Veuillez choisir une catégorie");

    const tempId = Date.now();
    const tempArticle: Article = {
      ...this.newArticle,
      id: tempId,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(),
      category: this.categories.find(c => c.id === this.newArticle.categoryId)
    };

    if (!this.isEditMode) {
      // Ajout local immédiat
      this.articles = [...this.articles, tempArticle];
      this.cdr.detectChanges();
    }

    const obs = this.isEditMode && this.currentArticleId
      ? this.blogService.updateArticle(this.currentArticleId, this.newArticle)
      : this.blogService.createArticle(this.newArticle, this.newArticle.categoryId);

    obs.subscribe({
      next: (saved) => {
        if (!this.isEditMode) {
          // Remplacer l'article temporaire par l'article réel
          this.articles = this.articles.map(a => a.id === tempId ? saved : a);
        } else {
          // Mettre à jour l'article existant
          this.articles = this.articles.map(a => a.id === this.currentArticleId ? saved : a);
        }
        this.cdr.detectChanges();
        this.refreshData(); // pour mettre à jour les stats et les compteurs
        this.showModal = false;
      },
      error: (err) => {
        if (!this.isEditMode) {
          // Supprimer l'article temporaire en cas d'erreur
          this.articles = this.articles.filter(a => a.id !== tempId);
        }
        this.cdr.detectChanges();
        console.error(err);
        alert("Erreur lors de la sauvegarde de l'article.");
      }
    });
  }
} 
