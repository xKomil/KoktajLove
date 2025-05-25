// frontend/src/pages/HomePage.tsx
import React from 'react';
import Button from '@/components/ui/Button/Button';
import FeatureCard from '@/components/ui/FeatureCard/FeatureCard';
import CategoryCard from '@/components/ui/CategoryCard/CategoryCard';
import styles from './PageStyles.module.css';

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z"/>
  </svg>
);

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <BookIcon />,
      title: "Bogata Baza Przepisów",
      description: "Tysiące inspirujących przepisów na koktajle na każdą okazję - od klasycznych po nowoczesne kreacje."
    },
    {
      icon: <SearchIcon />,
      title: "Intuicyjne Wyszukiwanie",
      description: "Znajdź idealny koktajl w kilka sekund dzięki zaawansowanym filtrom i kategoryzacji."
    },
    {
      icon: <HeartIcon />,
      title: "Twoje Listy Ulubionych",
      description: "Zapisuj i organizuj przepisy, które kochasz. Twórz własne kolekcje na różne okazje."
    }
  ];

  const categories = [
    {
      name: "Klasyki",
      description: "Timeless cocktails that never go out of style",
      imageGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      link: "/login"
    },
    {
      name: "Tropikalne",
      description: "Escape to paradise with exotic flavors",
      imageGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      link: "/login"
    },
    {
      name: "Bezalkoholowe",
      description: "Delicious mocktails for everyone",
      imageGradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      link: "/login"
    },
    {
      name: "Na Imprezę",
      description: "Perfect drinks for celebrations",
      imageGradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      link: "/login"
    }
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Odkryj świat smaków z <span className={styles.brandName}>KoktajLOVE</span>!
          </h1>
          <p className={styles.heroSubtitle}>
            Największa społeczność miłośników koktajli w Polsce. Znajdź inspirację, 
            dziel się przepisami i twórz niezapomniane smaki.
          </p>
          <div className={styles.heroActions}>
            <Button 
              as="link" 
              to="/register" 
              variant="secondary" 
              size="lg"
            >
              Dołącz do Nas
            </Button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroGradientBg}></div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Poznaj możliwości KoktajLOVE</h2>
          <p className={styles.sectionSubtitle}>
            Wszystko czego potrzebujesz, aby odkrywać i tworzyć wspaniałe koktajle
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.categoriesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Eksploruj kategorie</h2>
          <p className={styles.sectionSubtitle}>
            Znajdź koktajle idealne na każdą okazję
          </p>
        </div>
        <div className={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              name={category.name}
              description={category.description}
              imageGradient={category.imageGradient}
              link={category.link}
            />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Gotowy zacząć swoją przygodę?</h2>
          <p className={styles.ctaSubtitle}>
            Dołącz do tysięcy użytkowników, którzy już odkrywają świat koktajli z KoktajLOVE
          </p>
          <div className={styles.ctaActions}>
            <Button 
              as="link" 
              to="/register" 
              variant="primary" 
              size="lg"
            >
              Stwórz Konto za Darmo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;