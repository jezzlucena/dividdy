import { setRequestLocale } from 'next-intl/server';

type Props = {
  children: React.ReactNode;
  params: { locale: string; shareCode: string };
};

export default function GroupLayout({ children, params: { locale } }: Props) {
  // Enable static rendering
  setRequestLocale(locale);
  
  return children;
}
