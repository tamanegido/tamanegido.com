/**
 * Cloudflare Functions (Workers) で実行される
 * BASEのショップページから最新の商品情報を取得するAPIエンドポイント
 * 
 * 実行タイミング: リクエスト時（クライアントから呼び出された時）
 * ビルド不要で常に最新の情報を取得可能
 */
export async function onRequest(context) {
  try {
    // Cloudflare Workers環境でfetchは使用可能
    const response = await fetch('https://cozy.books-tamanegido.shop/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ShopItemsBot/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const html = await response.text();
    
    const items = [];
    
    // BASEのショップページから商品情報を抽出
    // 商品ブロックのパターンを探す: <li>タグ内に商品リンクがある
    const itemBlockRegex = /<li[^>]*>[\s\S]*?<a[^>]*href="(\/items\/\d+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<\/li>/g;
    
    let blockMatch;
    const seenLinks = new Set();
    
    while ((blockMatch = itemBlockRegex.exec(html)) !== null && items.length < 6) {
      const blockHtml = blockMatch[0];
      const linkPath = blockMatch[1];
      const fullLink = `https://cozy.books-tamanegido.shop${linkPath}`;
      
      // 重複を避ける
      if (seenLinks.has(fullLink)) continue;
      seenLinks.add(fullLink);
      
      // タイトルを抽出（複数のパターンを試す）
      let title = '';
      const titlePatterns = [
        /<p[^>]*>([^<]+)<\/p>/g,
        /<h[23][^>]*>([^<]+)<\/h[23]>/g,
        /alt="([^"]+)"/,
        /title="([^"]+)"/,
      ];
      
      for (const pattern of titlePatterns) {
        const match = blockHtml.match(pattern);
        if (match && match[1]) {
          title = match[1].trim();
          // 【】やHTMLエンティティを除去
          title = title.replace(/【[^】]*】/g, '').trim();
          title = title.replace(/&[^;]+;/g, '');
          if (title && title.length > 5 && title.length < 100) break;
        }
      }
      
      // 価格を抽出
      const priceMatch = blockHtml.match(/¥([\d,]+)/);
      const price = priceMatch ? priceMatch[1] : '';
      
      // 画像URLを抽出
      const imgMatch = blockHtml.match(/<img[^>]+src="([^"]+)"[^>]*>/);
      let image = '';
      if (imgMatch && imgMatch[1]) {
        image = imgMatch[1];
        if (!image.startsWith('http')) {
          image = image.startsWith('/') 
            ? `https://cozy.books-tamanegido.shop${image}`
            : `https://cozy.books-tamanegido.shop/${image}`;
        }
      }
      
      if (title && fullLink) {
        items.push({
          title: title.substring(0, 80), // 長すぎるタイトルを切り詰め
          price: price ? `¥${price}` : '',
          image: image,
          link: fullLink
        });
      }
    }
    
    return new Response(JSON.stringify({ items }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5分キャッシュ
      },
    });
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return new Response(JSON.stringify({ error: error.message, items: [] }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

