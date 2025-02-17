/** 
 * 2025-02-17 15:30:00
 * 下記修正を行いました:
 * 1. キーワード未入力時はリストを非表示
 * 2. 8行表示が可能 (最大8件分の高さを超える場合はスクロール)
 * 3. 文字サイズを小さめに変更, 住所を表示
 * 4. スクロールバー非表示
 * 5. 各店舗ボーダーライン削除
**/

import React, { useState, useMemo } from 'react';
import './SearchList.scss';

type Props = {
  data: Pwamap.ShopData[];
};

/**
 * 全角英数字/スペースを半角へ置換し、小文字に統一
 */
function normalizeText(str: string) {
  return str
    // 全角英数字記号→半角
    .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    // 全角スペース→半角スペース
    .replace(/　/g, ' ')
    // 小文字化
    .toLowerCase();
}

function SearchList(props: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  // リアルタイム検索
  const filteredData = useMemo(() => {
    const q = normalizeText(searchQuery || '');
    if (!q) {
      return [];
    }
    return props.data.filter((shop) => {
      // 検索対象のフィールドを連結
      const textForSearch = [
        shop['スポット名'] ?? '',
        shop['紹介文'] ?? '',
        shop['営業時間'] ?? '',
        shop['定休日'] ?? '',
        shop['住所'] ?? '',  // CSVに"住所"列が追加される前提
      ].join(' ');
      const normalized = normalizeText(textForSearch);
      return normalized.includes(q);
    });
  }, [props.data, searchQuery]);

  // キーワード未入力時は検索リストそのものを表示しない
  const isEmptyQuery = !searchQuery.trim();

  // 高さ計算: 1行あたり約50px想定。最大8行(=400px)
  const lineHeight = 50;
  const itemCount = filteredData.length;
  const maxLines = 8;

  // 実際の行数が 8未満ならその分だけ高さを縮める
  let containerHeight = itemCount * lineHeight;
  if (containerHeight > maxLines * lineHeight) {
    containerHeight = maxLines * lineHeight;
  }
  // 0件の場合は 0px
  if (containerHeight < 1) {
    containerHeight = 0;
  }

  return (
    <div className="search-list">
      {/* 検索入力欄 */}
      <input
        className="search-input"
        type="text"
        value={searchQuery}
        placeholder="キーワードを入力"
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* キーワード未入力時はリスト非表示 */}
      {!isEmptyQuery && (
        <div
          className="search-list-container"
          style={{
            maxHeight: containerHeight,
          }}
        >
          {filteredData.map((shop, index) => (
            <div key={index} className="search-list-item">
              <div className="search-list-text">
                <div className="shop-name">{shop['スポット名']}</div>
                <div className="shop-hours">営業時間: {shop['営業時間'] || ''}</div>
                <div className="shop-dayoff">定休日: {shop['定休日'] || ''}</div>
                <div className="shop-address">住所: {shop['住所'] || ''}</div>
              </div>
              <div className="search-list-image">
                {shop['画像'] && (
                  <img src={shop['画像']} alt={shop['スポット名']} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchList;
