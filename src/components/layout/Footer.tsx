import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer_copy">
        © {new Date().getFullYear()} Binance 2.0 — Datos de{' '}
        <a
          href="https://www.coingecko.com"
          target="_blank"
          rel="noopener noreferrer"
          className="footer_link"
        >
          CoinGecko
        </a>
        . Solo para fines educativos.
      </p>
    </footer>
  );
}
