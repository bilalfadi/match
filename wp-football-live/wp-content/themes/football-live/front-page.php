<?php
if (!defined('ABSPATH')) { exit; }
get_header();

$hero_bg = "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80";
?>

<section class="hero">
  <div class="hero-bg" style="background-image:url('<?php echo esc_url($hero_bg); ?>')"></div>
  <div class="hero-overlay"></div>
  <div class="container hero-inner">
    <h1>Watch Live Football Matches &amp; Latest News</h1>
    <p>Stream the biggest games live and stay updated with breaking news, scores, and analysis from the world of football.</p>
  </div>
</section>

<main>
  <section class="container section">
    <div class="section-title">
      <h2><span class="text-primary">▌</span> Live Matches</h2>
    </div>
    <?php echo do_shortcode('[football_live_matches status="LIVE" limit="10"]'); ?>
  </section>

  <?php
    $sections = array(
      array('title' => 'Latest News', 'slug' => 'news', 'url' => home_url('/news/')),
      array('title' => 'Football', 'slug' => 'football', 'url' => home_url('/football/')),
      array('title' => 'Premier League', 'slug' => 'premier-league', 'url' => home_url('/premier-league/')),
    );
    foreach ($sections as $s) :
      $q = new WP_Query(array(
        'post_type' => 'post',
        'posts_per_page' => 6,
        'ignore_sticky_posts' => true,
        'category_name' => $s['slug'],
      ));
  ?>
    <section class="container section">
      <div class="section-title">
        <h2><span class="text-primary">▌</span> <?php echo esc_html($s['title']); ?></h2>
        <a class="view-all" href="<?php echo esc_url($s['url']); ?>">View all</a>
      </div>
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
        <?php endwhile; wp_reset_postdata(); else: ?>
          <p class="muted">No posts.</p>
        <?php endif; ?>
      </div>
    </section>
  <?php endforeach; ?>
</main>

<?php get_footer(); ?>

