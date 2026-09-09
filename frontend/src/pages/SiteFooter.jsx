import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant mt-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="border border-outline-variant bg-surface-container-low rounded p-4 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={20} className="text-secondary shrink-0 mt-0.5" />
            <div>
              <span className="font-label-sm text-label-sm font-bold text-primary block">{t('footer_notice_title')}</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {t('footer_notice_text')}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6">
          <div className="md:col-span-2 flex flex-col gap-2">
            <span className="font-headline-sm text-[16px] font-bold text-primary">{t('footer_about_title')}</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              {t('footer_about_text')}
            </p>
          </div>
          <div>
            <span className="font-label-md text-label-md font-bold text-primary mb-2 block">{t('footer_quicklinks')}</span>
            <ul className="flex flex-col gap-1.5">
              <li className="font-body-sm text-body-sm"><Link className="text-on-surface-variant hover:text-primary transition-colors" to="/">{t('footer_privacy')}</Link></li>
              <li className="font-body-sm text-body-sm"><Link className="text-on-surface-variant hover:text-primary transition-colors" to="/">{t('footer_terms')}</Link></li>
            </ul>
          </div>
          <div>
            <span className="font-label-md text-label-md font-bold text-primary mb-2 block">{t('footer_project')}</span>
            <ul className="flex flex-col gap-1.5">
              <li className="font-body-sm text-body-sm"><Link className="text-on-surface-variant hover:text-primary transition-colors" to="/about">{t('footer_about_link')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-2 font-label-md text-label-md text-on-surface-variant text-center sm:text-left">
          <span>{t('footer_copyright')}</span>
        </div>
      </div>
    </footer>
  );
}