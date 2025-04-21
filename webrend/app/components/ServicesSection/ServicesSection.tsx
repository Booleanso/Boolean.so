import styles from './ServicesSection.module.scss';

interface ServicesSectionProps {
  title?: string;
}

const ServicesSection = ({ title = 'Our Services' }: ServicesSectionProps) => {
  return (
    <section className={styles.servicesSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.services}>
          {/* Service items will go here */}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
