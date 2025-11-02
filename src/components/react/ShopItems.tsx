import type React from 'react';
import useSWR from 'swr';
import { getTranslations, type Language } from '../../i18n';

interface ShopItem {
  title: string;
  price: string;
  image: string;
  link: string;
}

interface ShopItemsResponse {
  items: ShopItem[];
  error?: string;
}

interface ShopItemsProps {
  lang?: Language;
}

const fetcher = async (key: string): Promise<ShopItemsResponse> => {
  const res = await fetch(key);
  if (!res.ok) {
    throw new Error('Failed to fetch shop items');
  }
  return res.json();
};

const ShopItems: React.FC<ShopItemsProps> = ({ lang = 'ja' }) => {
  const t = getTranslations(lang);
  const { data, error, isLoading } = useSWR<ShopItemsResponse>(
    '/shop-items',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5分ごとに更新
    }
  );

  if (error) {
    return (
      <div className="shop-items-error">
        <p>{t.shopItems.error}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="shop-items-loading">
        <p>{t.shopItems.loading}</p>
      </div>
    );
  }

  if (!data.items || data.items.length === 0) {
    return null;
  }

  return (
    <div className="shop-items">
      <h2>{t.shopItems.title}</h2>
      <ul className="shop-items-grid">
        {data.items.map((item, index) => (
          <li key={index} className="shop-item">
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="shop-item-image"
                />
              )}
              <div className="shop-item-info">
                <h3 className="shop-item-title">{item.title}</h3>
                {item.price && (
                  <p className="shop-item-price">{item.price}</p>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
      <div className="shop-items-footer">
        <a
          href="https://cozy.books-tamanegido.shop/"
          target="_blank"
          rel="noopener noreferrer"
          className="shop-items-link"
        >
          {t.shopItems.viewAll}
        </a>
      </div>
      <style>{`
        .shop-items {
          margin: 2rem 0;
          padding: 1.5rem;
          background-color: #FFF9F5;
          border-radius: 0.4rem;
        }

        .shop-items h2 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          color: #7A5C3D;
        }

        .shop-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .shop-item {
          background-color: white;
          border-radius: 0.4rem;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .shop-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .shop-item a {
          display: block;
          text-decoration: none;
          color: inherit;
        }

        .shop-item-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          background-color: #f5f5f5;
        }

        .shop-item-info {
          padding: 0.75rem;
        }

        .shop-item-title {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.4;
          color: #111;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .shop-item-price {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #7A5C3D;
        }

        .shop-items-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .shop-items-link {
          color: #7A5C3D;
          text-decoration: underline;
          text-decoration-color: rgba(122, 92, 61, 0.3);
          font-size: 0.875rem;
          transition: color 0.2s ease, text-decoration-color 0.2s ease;
        }

        .shop-items-link:hover {
          color: #8B6543;
          text-decoration-color: rgba(139, 101, 67, 0.5);
        }

        .shop-items-loading,
        .shop-items-error {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        @media (max-width: 600px) {
          .shop-items-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 0.75rem;
          }

          .shop-item-image {
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default ShopItems;

