import Image from 'next/image';
import Link from 'next/link';

const FB_URL  = 'https://www.facebook.com/profile.php?id=100066440320462';
const IG_URL  = 'https://www.instagram.com/rey_grano/';
const WA_NUMBER = '59168666330';

interface Props {
  nombre?: string;
  ciudad?: string;
}

export function SiteFooter({ nombre = 'Grano Rey', ciudad }: Props) {

  return (
    <footer className="bg-gr-primary-dark border-t border-white/8 py-8">
      <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-6">

        {/* Logo Industrias Reynales */}
        <div className="relative w-44 h-20">
          <Image src="/logo-reynales.webp" alt="Industrias Reynales" fill sizes="176px" className="object-contain" />
        </div>

        {/* Centro: redes + copyright */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Facebook */}
            <a href={FB_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="rgba(255,255,255,0.75)" style={{ pointerEvents: 'none' }}>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>

            {/* Instagram */}
            <a href={IG_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,0.75)" stroke="none" />
              </svg>
            </a>

            {/* WhatsApp */}
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="rgba(255,255,255,0.75)" style={{ pointerEvents: 'none' }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.386a.75.75 0 0 0 .918.919l5.578-1.463A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.704 9.704 0 0 1-4.95-1.355l-.355-.21-3.676.964.981-3.584-.232-.369A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                </svg>
            </a>
          </div>
          <p className="text-white/20 text-[11px]">
            © {new Date().getFullYear()} Industrias Reynales{ciudad ? ` · ${ciudad}` : ''} · Bolivia
          </p>
        </div>

        {/* Acceso */}
        <Link href="/login" className="text-white/30 hover:text-white/65 text-[12px] transition-colors">
          Acceso al sistema →
        </Link>
      </div>
    </footer>
  );
}
