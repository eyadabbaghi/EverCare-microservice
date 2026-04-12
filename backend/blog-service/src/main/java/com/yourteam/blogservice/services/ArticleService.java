package com.yourteam.blogservice.services;

import com.yourteam.blogservice.Repository.ArticleLikeRepository;
import com.yourteam.blogservice.Repository.ArticleRepository;
import com.yourteam.blogservice.Repository.CategoryRepository;
import com.yourteam.blogservice.client.NotificationClient;
import com.yourteam.blogservice.dto.CategoryPerformanceDTO;
import com.yourteam.blogservice.dto.NotificationRequest;
import com.yourteam.blogservice.entity.Article;
import com.yourteam.blogservice.entity.ArticleLike;
import com.yourteam.blogservice.entity.Category;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CategoryRepository categoryRepository;
    private final ArticleLikeRepository likeRepository;
    private final NotificationClient notificationClient;  // Injection du client Feign

    private String performAutoTagging(String title, String content) {
        List<String> moods = new ArrayList<>();
        String text = (title + " " + content).toLowerCase();

        // Lost (désorientation, perte de sens)
        if (text.contains("memory") || text.contains("alzheimer") || text.contains("thinking") ||
                text.contains("confusion") || text.contains("cognitive") || text.contains("skills") ||
                text.contains("lost") || text.contains("stuck") || text.contains("direction") ||
                text.contains("purpose") || text.contains("overwhelmed")) {
            moods.add("lost");
        }

        // Stressed (stress, anxiété, tension)
        if (text.contains("agitation") || text.contains("behavior") || text.contains("decline") ||
                text.contains("disrupts") || text.contains("challenges") || text.contains("trouble") ||
                text.contains("stress") || text.contains("cortisol") || text.contains("anxiety") ||
                text.contains("nervous") || text.contains("tension")) {
            moods.add("stressed");
        }

        // Calm (apaisement, relaxation, sommeil)
        if (text.contains("sleep") || text.contains("diet") || text.contains("peaceful") ||
                text.contains("wellness") || text.contains("health") || text.contains("food") ||
                text.contains("vegetables") || text.contains("calm") || text.contains("restful") ||
                text.contains("relax") || text.contains("meditation") || text.contains("breathing")) {
            moods.add("calm");
        }

        // Lonely (isolement, besoin de soutien)
        if (text.contains("caregiver") || text.contains("support") || text.contains("person") ||
                text.contains("social") || text.contains("community") || text.contains("connection") ||
                text.contains("family") || text.contains("friends") || text.contains("lonely")) {
            moods.add("lonely");
        }

        return moods.isEmpty() ? "calm" : String.join(",", moods);
    }

    @Transactional
    public Article createArticle(Article article, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + categoryId));
        category.setTotalArticles((category.getTotalArticles() == null ? 0 : category.getTotalArticles()) + 1);
        categoryRepository.save(category);
        article.setMoods(performAutoTagging(article.getTitle(), article.getContent()));
        article.setCategory(category);
        Article saved = articleRepository.save(article);

        // Envoi de notification
        sendNotification(saved.getId().toString(), "CREATED", "New article: " + saved.getTitle());

        return saved;
    }

    public List<Article> getArticlesByCategory(Long categoryId) {
        return articleRepository.findByCategoryId(categoryId);
    }

    public List<Article> getAllArticles() {
        return articleRepository.findAll();
    }

    @Transactional
    public Article updateArticle(Long id, Article updatedArticle) {
        Article existingArticle = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
        existingArticle.setTitle(updatedArticle.getTitle());
        existingArticle.setContent(updatedArticle.getContent());
        existingArticle.setCoverImageUrl(updatedArticle.getCoverImageUrl());
        existingArticle.setIsPublished(updatedArticle.getIsPublished());
        existingArticle.setLastUpdated(LocalDateTime.now());
        existingArticle.setMoods(performAutoTagging(updatedArticle.getTitle(), updatedArticle.getContent()));
        if (updatedArticle.getCategory() != null &&
                (existingArticle.getCategory() == null || !existingArticle.getCategory().getId().equals(updatedArticle.getCategory().getId()))) {
            if (existingArticle.getCategory() != null) {
                Category oldCat = existingArticle.getCategory();
                oldCat.setTotalArticles(Math.max(0, (oldCat.getTotalArticles() == null ? 0 : oldCat.getTotalArticles()) - 1));
                categoryRepository.save(oldCat);
            }
            Category newCat = categoryRepository.findById(updatedArticle.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("New category not found"));
            newCat.setTotalArticles((newCat.getTotalArticles() == null ? 0 : newCat.getTotalArticles()) + 1);
            categoryRepository.save(newCat);
            existingArticle.setCategory(newCat);
        }
        Article saved = articleRepository.save(existingArticle);

        // Envoi de notification
        sendNotification(saved.getId().toString(), "UPDATED", "Article updated: " + saved.getTitle());

        return saved;
    }

    @Transactional
    public void deleteArticle(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
        String title = article.getTitle();
        likeRepository.deleteByArticleId(id);
        if (article.getCategory() != null) {
            Category cat = article.getCategory();
            cat.setTotalArticles(Math.max(0, (cat.getTotalArticles() == null ? 0 : cat.getTotalArticles()) - 1));
            categoryRepository.save(cat);
        }
        articleRepository.delete(article);

        // Envoi de notification
        sendNotification(id.toString(), "DELETED", "Article deleted: " + title);
    }

    @Transactional
    public Article likeArticle(Long articleId) {
        Long userId = 1L;
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        if (!likeRepository.existsByArticleIdAndUserId(articleId, userId)) {
            ArticleLike newLike = ArticleLike.builder()
                    .article(article)
                    .userId(userId)
                    .build();
            likeRepository.save(newLike);
            article.setLikeCount((article.getLikeCount() == null ? 0 : article.getLikeCount()) + 1);
        }
        return articleRepository.save(article);
    }

    @Transactional
    public Article dislikeArticle(Long articleId) {
        Long userId = 1L;
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        likeRepository.findByArticleIdAndUserId(articleId, userId).ifPresent(like -> {
            likeRepository.delete(like);
            article.setLikeCount(Math.max(0, (article.getLikeCount() == null ? 0 : article.getLikeCount()) - 1));
        });
        return articleRepository.save(article);
    }

    @Transactional
    public Article incrementViews(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
        article.setViewCount((article.getViewCount() == null ? 0 : article.getViewCount()) + 1);
        return articleRepository.save(article);
    }

    public List<CategoryPerformanceDTO> getCategoryStats() {
        return articleRepository.getCategoryPerformanceReport();
    }

    private void sendNotification(String activityId, String action, String details) {
        NotificationRequest request = new NotificationRequest();
        request.setActivityId(activityId);
        request.setAction(action);
        request.setDetails(details);
        try {
            notificationClient.sendNotification(request);
            log.info("Notification sent for article {}: {}", activityId, action);
        } catch (Exception e) {
            // Ne pas bloquer l’opération principale si la notification échoue
            log.error("Failed to send notification: {}", e.getMessage());
        }
    }
}