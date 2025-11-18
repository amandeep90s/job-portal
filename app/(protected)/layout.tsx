type Props = {
  children: React.ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  return <div>{children}</div>;
}
