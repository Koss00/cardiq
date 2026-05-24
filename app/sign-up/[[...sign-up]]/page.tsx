import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#060E1C] flex items-center justify-center px-4">
      {/* Background glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,200,66,0.1) 0%, transparent 70%)',
          filter: 'blur(2px)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
            <span className="relative font-card text-[#060E1C] text-base font-black tracking-tight z-10">IQ</span>
          </div>
          <span className="font-card text-2xl tracking-widest chrome-text select-none">CARDIQ</span>
        </div>

        <SignUp
          appearance={{
            variables: {
              colorPrimary: '#F5C842',
              colorBackground: '#111D33',
              colorInputBackground: '#0D1727',
              colorInputText: '#e8edf5',
              colorText: '#e8edf5',
              colorTextSecondary: '#8892A4',
              colorDanger: '#ef4444',
              borderRadius: '6px',
              fontFamily: 'var(--font-display), system-ui, sans-serif',
            },
            elements: {
              card: 'bg-[#111D33] border border-[#1E2D45] shadow-2xl',
              headerTitle: 'text-white font-display font-black uppercase tracking-widest',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton: 'border-[#1E2D45] bg-[#0D1727] text-slate-300 hover:bg-[#131E34]',
              dividerLine: 'bg-[#1E2D45]',
              dividerText: 'text-slate-500',
              formFieldLabel: 'text-slate-400 text-xs uppercase tracking-widest font-display font-semibold',
              formFieldInput: 'bg-[#0D1727] border-[#1E2D45] text-white focus:border-[#F5C842]',
              formButtonPrimary: 'bg-[#F5C842] hover:bg-[#FADA65] text-[#060E1C] font-black uppercase tracking-widest',
              footerActionLink: 'text-[#F5C842] hover:text-[#FADA65]',
            },
          }}
        />
      </div>
    </div>
  );
}
