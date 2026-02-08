interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  font?: string;
}

export default function PageLayout({
  children,
  className = "",
  font = "font-fredoka",
}: PageLayoutProps) {
  return <div className={`p-8 ${className} ${font}`}>{children}</div>;
}
