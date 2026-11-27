import { Component, type ReactNode } from 'react';

// Last line of defence: a render crash shows a calm bilingual page with a reload button instead of a white screen.
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const ar = localStorage.getItem('biblio.lang') === 'ar' || document.documentElement.lang === 'ar';
    return (
      <main className="page-message" role="alert" dir={ar ? 'rtl' : 'ltr'} style={{ textAlign: 'center', padding: '72px 16px' }}>
        <h1>{ar ? 'حدث خطأ غير متوقع' : 'Something went wrong'}</h1>
        <p className="muted">{ar ? 'لم يُفقد شيء. أعد تحميل الصفحة وحاول مرة أخرى.' : 'Nothing was lost. Reload the page and try again.'}</p>
        <button type="button" className="pill" onClick={() => window.location.reload()}>{ar ? 'إعادة التحميل' : 'Reload'}</button>
      </main>
    );
  }
}
