/**
 * みなみレンタカー 在庫確認システム
 * JavaScript メインファイル
 */

// ========================================
// 定数定義
// ========================================

// Google Apps Script Web AppのURL（本番環境用）
// 注意: 実際のDEPLOY_IDに置き換えてください
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxf4B6f19bUAifELWuUtxShErjdFWJv3kCQfwl_zW-yrrtFFMCzWohUkso2PkoY6Aqo/exec';

// Google Form予約フォームのURL
const GOOGLE_FORM_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSedbtgPQwMnGz-FGpNchCGh0iukiX-2a6TiL9_081A_Lu1yCw/viewform';

// 車両タイプと絵文字のマッピング
const VEHICLE_ICONS = {
    '軽自動車': '🚗',
    '一般乗用車': '🚙'
};

// ========================================
// DOM要素の取得
// ========================================

let form, loadingElement, resultElement;
let currentFormData = null; // 現在のフォームデータを保持

/**
 * DOMContentLoadedイベント - DOM読み込み完了時に実行
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM要素の取得
    form = document.getElementById('availabilityForm');
    loadingElement = document.getElementById('loading');
    resultElement = document.getElementById('result');

    // 今日の日付を取得して、貸出日の最小値として設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pickupDate').setAttribute('min', today);
    document.getElementById('returnDate').setAttribute('min', today);

    // フォーム送信イベントリスナーの設定
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // 貸出日が変更されたら、返却日の最小値を更新
    document.getElementById('pickupDate').addEventListener('change', function() {
        const pickupDate = this.value;
        if (pickupDate) {
            document.getElementById('returnDate').setAttribute('min', pickupDate);
        }
    });
});

// ========================================
// フォーム送信処理
// ========================================

/**
 * フォーム送信イベントハンドラー
 * @param {Event} event - フォーム送信イベント
 */
async function handleFormSubmit(event) {
    // デフォルトのフォーム送信を防止
    event.preventDefault();

    // フォームデータの取得
    const formData = getFormData();

    // バリデーション
    if (!validateFormData(formData)) {
        return;
    }

    // 在庫確認APIを呼び出し
    await checkAvailability(formData);
}

/**
 * フォームデータの取得
 * @returns {Object} フォームデータオブジェクト
 */
function getFormData() {
    return {
        pickupDate: document.getElementById('pickupDate').value,
        pickupTime: document.getElementById('pickupTime').value,
        pickupBranch: document.getElementById('pickupBranch').value,
        returnDate: document.getElementById('returnDate').value,
        returnTime: document.getElementById('returnTime').value,
        returnBranch: document.getElementById('returnBranch').value
    };
}

// ========================================
// バリデーション
// ========================================

/**
 * フォームデータのバリデーション
 * @param {Object} data - フォームデータ
 * @returns {boolean} バリデーション結果
 */
function validateFormData(data) {
    // 全項目が入力されているかチェック
    if (!data.pickupDate || !data.pickupTime || !data.pickupBranch ||
        !data.returnDate || !data.returnTime || !data.returnBranch) {
        showError('すべての項目を入力してください。');
        return false;
    }

    // 貸出日時と返却日時の作成
    const pickupDateTime = new Date(`${data.pickupDate}T${data.pickupTime}:00`);
    const returnDateTime = new Date(`${data.returnDate}T${data.returnTime}:00`);

    // 返却日時が貸出日時より後であるかチェック
    if (returnDateTime <= pickupDateTime) {
        showError('返却日時は貸出日時より後に設定してください。');
        return false;
    }

    // 貸出日時が過去でないかチェック
    const now = new Date();
    if (pickupDateTime < now) {
        showError('貸出日時は現在より後に設定してください。');
        return false;
    }

    return true;
}

// ========================================
// API連携
// ========================================

/**
 * 在庫確認APIの呼び出し
 * @param {Object} data - フォームデータ
 */
async function checkAvailability(data) {
    try {
        // ローディング表示
        showLoading();

        // フォームデータを保存
        currentFormData = data;

        // 貸出日時と返却日時をISO 8601形式に変換
        const pickupDateTime = `${data.pickupDate}T${data.pickupTime}:00`;
        const returnDateTime = `${data.returnDate}T${data.returnTime}:00`;

        // APIリクエストURLの作成
        const url = buildApiUrl({
            action: 'checkAvailability',
            pickupBranch: data.pickupBranch,
            returnBranch: data.returnBranch,
            pickupDateTime: pickupDateTime,
            returnDateTime: returnDateTime
        });

        // API呼び出し
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-cache'
        });

        // レスポンスのチェック
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        // JSONデータの取得
        const result = await response.json();

        // 結果の表示
        displayResult(result);

    } catch (error) {
        // エラーハンドリング
        console.error('在庫確認エラー:', error);
        showError('在庫確認中にエラーが発生しました。しばらく時間をおいて再度お試しください。');
    } finally {
        // ローディング非表示
        hideLoading();
    }
}

/**
 * APIリクエストURLの作成
 * @param {Object} params - URLパラメータ
 * @returns {string} 完全なAPIリクエストURL
 */
function buildApiUrl(params) {
    const url = new URL(API_ENDPOINT);
    Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
    });
    return url.toString();
}

/**
 * Google Form予約URLの作成（フォームデータの自動入力）
 * @param {Object} formData - フォームデータ
 * @returns {string} 完全なGoogle Form予約URL
 */
function buildFormUrl(formData) {
    // 時刻のゼロ埋めを削除（09:00 → 9:00）
    const pickupTime = formData.pickupTime.replace(/^0/, '');
    const returnTime = formData.returnTime.replace(/^0/, '');

    const params = new URLSearchParams({
        'usp': 'pp_url',
        'entry.1435092602': formData.pickupDate,
        'entry.131279204': pickupTime,
        'entry.1888786569': formData.pickupBranch,
        'entry.147933508': formData.returnDate,
        'entry.1669227513': returnTime,
        'entry.2017105635': formData.returnBranch
    });
    return `${GOOGLE_FORM_BASE_URL}?${params.toString()}`;
}

// ========================================
// UI表示制御
// ========================================

/**
 * ローディング表示
 */
function showLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
    if (resultElement) {
        resultElement.style.display = 'none';
    }
    // 送信ボタンを無効化
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }
}

/**
 * ローディング非表示
 */
function hideLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    // 送信ボタンを有効化
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = false;
    }
}

/**
 * 結果の表示
 * @param {Object} result - API応答データ
 */
function displayResult(result) {
    if (!resultElement) {
        return;
    }

    // 結果エリアをクリア
    resultElement.innerHTML = '';
    resultElement.style.display = 'block';

    if (result.success && result.available) {
        // 在庫ありの場合
        displayAvailableResult(result.available, result.pricing || null);
    } else {
        // 在庫なしまたはエラーの場合
        displayUnavailableResult(result.message);
    }

    // 結果エリアまでスムーズスクロール
    resultElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * 在庫ありの結果表示
 * @param {Object} available - 在庫データ
 * @param {Object} pricing - 料金データ
 */
function displayAvailableResult(available, pricing) {
    resultElement.className = 'result success';

    // タイトル
    const title = document.createElement('h3');
    title.className = 'result-title';
    title.innerHTML = '✅ 利用可能な車両';
    resultElement.appendChild(title);

    // 車両リスト
    const vehicleList = document.createElement('ul');
    vehicleList.className = 'vehicle-list';

    Object.keys(available).forEach(vehicleType => {
        const count = available[vehicleType];
        if (count > 0) {
            const item = document.createElement('li');
            item.className = 'vehicle-item';
            const icon = VEHICLE_ICONS[vehicleType] || '🚗';
            item.innerHTML = `${icon} <strong>${vehicleType}:</strong> ${count}台`;
            vehicleList.appendChild(item);
        }
    });

    resultElement.appendChild(vehicleList);

    // 料金情報を表示
    if (pricing) {
        const priceSection = document.createElement('div');
        priceSection.className = 'price-section';

        let priceHTML = `
            <div class="price-info">
                <h4>💰 レンタル料金</h4>
                <div class="price-total">¥${pricing.rentalFee.toLocaleString()}（${pricing.rentalDays}日間）</div>
        `;

        // 内訳
        if (pricing.breakdown && pricing.breakdown.length > 0) {
            priceHTML += '<div class="price-breakdown">';
            pricing.breakdown.forEach(item => {
                priceHTML += `<div class="breakdown-item">- ${item.item}: ¥${item.amount.toLocaleString()}</div>`;
            });
            priceHTML += '</div>';
        }

        // ガソリンポリシー
        priceHTML += `<div class="fuel-policy">⛽ ${pricing.fuelPolicy}</div>`;

        // 乗り捨て特典
        if (pricing.hasOneWayBonus && pricing.oneWayBonusMessage) {
            priceHTML += `<div class="oneway-bonus">${pricing.oneWayBonusMessage}</div>`;
        }

        priceHTML += '</div>';
        priceSection.innerHTML = priceHTML;
        resultElement.appendChild(priceSection);
    }

    // 注記
    const note = document.createElement('p');
    note.className = 'result-note';
    note.innerHTML = `
        ※ 表示料金は全車種共通です<br>
        ※ 空港送迎無料<br>
        ※ 奄美空港店ではカード決済可能
    `;
    resultElement.appendChild(note);

    // 予約ボタンの作成
    if (currentFormData) {
        const formUrl = buildFormUrl(currentFormData);
        const bookingButton = document.createElement('a');
        bookingButton.href = formUrl;
        bookingButton.target = '_blank';
        bookingButton.rel = 'noopener noreferrer';
        bookingButton.className = 'reservation-link';
        bookingButton.innerHTML = '📝 ご予約はこちら';
        resultElement.appendChild(bookingButton);
    }
}

/**
 * 在庫なしの結果表示
 * @param {string} message - エラーメッセージ
 */
function displayUnavailableResult(message = null) {
    resultElement.className = 'result error';

    // タイトル
    const title = document.createElement('h3');
    title.className = 'result-title';
    title.innerHTML = '❌ 申し訳ございません';
    resultElement.appendChild(title);

    // メッセージ
    const content = document.createElement('div');
    content.className = 'result-content';
    content.innerHTML = `
        <p>${message || 'ご指定の日時は満車となっております。'}</p>
        <p>別の日程をお試しいただくか、お電話でお問い合わせください。</p>
    `;
    resultElement.appendChild(content);
}

/**
 * エラーメッセージの表示
 * @param {string} message - エラーメッセージ
 */
function showError(message) {
    if (!resultElement) {
        alert(message);
        return;
    }

    resultElement.className = 'result error';
    resultElement.innerHTML = '';
    resultElement.style.display = 'block';

    const title = document.createElement('h3');
    title.className = 'result-title';
    title.innerHTML = '⚠️ エラー';
    resultElement.appendChild(title);

    const content = document.createElement('div');
    content.className = 'result-content';
    content.innerHTML = `<p>${message}</p>`;
    resultElement.appendChild(content);

    // 結果エリアまでスムーズスクロール
    resultElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========================================
// ユーティリティ関数
// ========================================

/**
 * 日付を YYYY-MM-DD 形式にフォーマット
 * @param {Date} date - 日付オブジェクト
 * @returns {string} フォーマット済み日付文字列
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * ISO 8601形式の日時文字列を読みやすい形式に変換
 * @param {string} isoString - ISO 8601形式の日時文字列
 * @returns {string} 読みやすい日時文字列
 */
function formatDateTime(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}
