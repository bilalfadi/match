<?php
if (!defined('ABSPATH')) { exit; }
get_header();
?>

<main class="container section">
  <?php if (have_posts()) : ?>
    <div class="grid grid-3">
      <?php while (have_posts()) : the_post(); ?>
        <article class="glass-card post-card">
          <a href="<?php the_permalink(); ?>">
            <div class="post-thumb">
              <?php if (has_post_thumbnail()) : ?>
                <?php the_post_thumbnail('large'); ?>
              <?php else: ?>
                <img alt="" src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80" />
              <?php endif; ?>
            </div>
            <h3 class="post-title"><?php the_title(); ?></h3>
            <p class="post-excerpt"><?php echo esc_html(wp_trim_words(get_the_excerpt(), 22)); ?></p>
            <div class="post-meta"><?php echo esc_html(get_the_date()); ?></div>
          </a>
        </article>
      <?php endwhile; ?>
    </div>

    <div style="margin-top:18px;">
      <?php the_posts_pagination(); ?>
    </div>
  <?php else: ?>
    <p class="muted">No posts found.</p>
  <?php endif; ?>
</main>

<?php get_footer(); ?>

