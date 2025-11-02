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
    // 商品リンクのパターンを探す
    const itemLinkRegex = /href="(https:\/\/cozy\.books-tamanegido\.shop\/items\/\d+)"/g;

    let linkMatch;
    const seenLinks = new Set();

    while ((linkMatch = itemLinkRegex.exec(html)) !== null && items.length < 6) {
      const fullLink = linkMatch[1];

      // 重複を避ける
      if (seenLinks.has(fullLink)) continue;
      seenLinks.add(fullLink);

      // リンク周辺のHTMLを抽出（より広い範囲を取得）
      const linkIndex = html.indexOf(linkMatch[0]);
      if (linkIndex === -1) continue;

      // リンクの前後2000文字を取得（商品ブロック全体を含む）
      const startIndex = Math.max(0, linkIndex - 500);
      const endIndex = Math.min(html.length, linkIndex + 2000);
      const blockHtml = html.substring(startIndex, endIndex);

      // タイトルを抽出（items-grid_itemTitleTextクラスから）
      let title = '';
      const titleMatch = blockHtml.match(/<p[^>]*class="[^"]*items-grid_itemTitleText[^"]*"[^>]*>([^<]+)<\/p>/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      } else {
        // フォールバック: alt属性から
        const altMatch = blockHtml.match(/alt="([^"]+)"/);
        if (altMatch && altMatch[1]) {
          title = altMatch[1].trim();
        }
      }

      // 価格を抽出（items-grid_priceクラスから）
      const priceMatch = blockHtml.match(/<p[^>]*class="[^"]*items-grid_price[^"]*"[^>]*>¥([\d,]+)<\/p>/);
      const price = priceMatch ? priceMatch[1] : '';

      // 画像URLを抽出（items-grid_imageクラスを優先、ラベル画像は除外）
      let image = '';
      // items-grid_imageを含むが、items-grid_imageLabelを含まない画像を探す
      // より柔軟なパターン: class属性の順序に関係なく抽出
      const imgRegex = /<img[^>]*>/g;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(blockHtml)) !== null) {
        const imgTag = imgMatch[0];
        // class属性を確認
        const classMatch = imgTag.match(/class="([^"]+)"/);
        if (!classMatch) continue;

        const classAttr = classMatch[1];
        // items-grid_imageを含み、items-grid_imageLabelを含まない画像を探す
        if (classAttr.includes('items-grid_image') && !classAttr.includes('items-grid_imageLabel')) {
          // src属性を抽出
          const srcMatch = imgTag.match(/src="([^"]+)"/);
          if (srcMatch && srcMatch[1]) {
            image = srcMatch[1];
            break;
          }
        }
      }

      if (image) {
        // HTMLエンティティをデコード
        image = image.replace(/&amp;/g, '&');
        // ラベル画像を除外（念のため）
        if (image.includes('static.thebase.in/img/apps/itemlabel')) {
          image = '';
        }
        // 相対URLの場合は絶対URLに変換
        if (image && !image.startsWith('http')) {
          image = image.startsWith('/')
            ? `https://cozy.books-tamanegido.shop${image}`
            : `https://cozy.books-tamanegido.shop/${image}`;
        }
      }

      if (title && fullLink) {
        items.push({
          title: title.substring(0, 80),
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

