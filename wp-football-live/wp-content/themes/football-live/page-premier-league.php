<?php
if (!defined('ABSPATH')) { exit; }
if (!defined('DONOTCACHEPAGE')) { define('DONOTCACHEPAGE', true); }
get_header();

global $post;
$cat_slug = ($post && $post->post_name) ? strtolower($post->post_name) : 'premier-league';
$paged = max(1, get_query_var('paged') ?: (isset($_GET['paged']) ? (int) $_GET['paged'] : 1));
$cat = get_category_by_slug($cat_slug);
$q = new WP_Query(array(
  'post_type' => 'post',
  'post_status' => 'publish',
  'posts_per_page' => 9,
  'ignore_sticky_posts' => true,
  'paged' => $paged,
  'cat' => $cat ? $cat->term_id : 0,
  'orderby' => 'date',
  'order' => 'DESC',
));
$hero_bg = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80';
?>
<section class="hero">
  <div class="hero-bg" style="background-image:url('<?php echo esc_url($hero_bg); ?>')"></div>
  <div class="hero-overlay"></div>
  <div class="container hero-inner">
    <h1>Premier League</h1>
    <p>Live updates, results and transfer news from the English Premier League.</p>
  </div>
</section>
<main class="container section">
  <header class="section-title">
    <h2><span class="text-primary">▌</span> Premier League</h2>
  </header>

  <div class="grid grid-3">
    <?php if ($q->have_posts()) : while ($q->have_posts()) : $q->the_post(); ?>
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
    <?php endwhile; wp_reset_postdata(); ?>
    <?php if ($q->max_num_pages > 1) : ?>
      <div class="pagination-wrap" style="margin-top:24px;">
        <?php echo paginate_links(array('total' => $q->max_num_pages, 'current' => $paged)); ?>
      </div>
    <?php endif; ?>
    <?php else: ?>
      <p class="muted">No posts in this category yet.</p>
    <?php endif; ?>
  </div>
</main>

<?php get_footer(); ?>

