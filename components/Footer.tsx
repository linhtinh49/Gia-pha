export interface FooterProps {
  className?: string;
  showDisclaimer?: boolean;
}

export default function Footer({
  className = "",
  showDisclaimer = false,
}: FooterProps) {
  return (
    <footer
      className={`py-8 text-center text-sm text-stone-500 ${className} backdrop-blur-sm`}
    >
      <div className="max-w-7xl mx-auto px-4">
      </div>
    </footer>
  );
}
