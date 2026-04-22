document.addEventListener('DOMContentLoaded', () => {
    // 1. 현재 날짜 설정
    const today = new Date();
    const dateStr = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, '0')}. ${String(today.getDate()).padStart(2, '0')}`;
    document.getElementById('currentDate').textContent = dateStr;

    // 2. 데이터 파일 로드 (CORS 대응: 임베디드 데이터 우선 사용)
    const csvPath = 'data/ssg_ranking_20260420.csv';

    if (typeof rawData !== 'undefined') {
        console.log('Using embedded rawData...');
        const items = parseCSV(rawData);
        renderDashboard(items);
    } else {
        console.log('Fetching CSV from path...');
        fetch(csvPath)
            .then(response => response.text())
            .then(data => {
                const items = parseCSV(data);
                renderDashboard(items);
            })
            .catch(error => {
                console.error('Error loading CSV:', error);
            });
    }

    // 3. 로직 함수: CSV 파싱 (따옴표 내 콤마 및 빈 필드 처리 개선)
    function parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];

        const headerLine = lines[0].replace(/^\ufeff/, '');
        const headers = headerLine.split(',').map(h => h.trim());
        
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = [];
            let curr = "";
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(curr.trim());
                    curr = "";
                } else {
                    curr += char;
                }
            }
            values.push(curr.trim());

            const item = {};
            headers.forEach((h, idx) => {
                let val = values[idx] || "";
                // 앞뒤 따옴표 제거
                val = val.replace(/^"|"$/g, '');
                item[h] = val;
            });
            results.push(item);
        }
        return results;
    }

    // 4. 로직 함수: 대시보드 렌더링
    function renderDashboard(items) {
        if (items.length === 0) return;

        // KPI 집계
        const totalProducts = items.length;
        const validPrices = items.map(d => {
            const p = String(d.price || "").replace(/,/g, '');
            return parseInt(p);
        }).filter(p => !isNaN(p) && p > 0);
        
        const avgPrice = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0;
        
        const validDiscounts = items.map(d => {
            const d_rate = String(d.discount_rate || "").replace(/,/g, '');
            return parseInt(d_rate);
        }).filter(d => !isNaN(d));
        const avgDiscount = validDiscounts.length > 0 ? validDiscounts.reduce((a, b) => a + b, 0) / validDiscounts.length : 0;

        // 빈도 기준 Top 브랜드 찾기
        const brandCounts = {};
        let topBrand = "정보 없음";
        let maxCount = 0;
        items.forEach(d => {
            if (d.brand && d.brand !== "") {
                brandCounts[d.brand] = (brandCounts[d.brand] || 0) + 1;
                if (brandCounts[d.brand] > maxCount) {
                    maxCount = brandCounts[d.brand];
                    topBrand = d.brand;
                }
            }
        });

        // DOM 업데이트
        document.getElementById('totalProducts').textContent = totalProducts.toLocaleString();
        document.getElementById('avgPrice').textContent = `₩ ${Math.round(avgPrice).toLocaleString()}`;
        document.getElementById('avgDiscount').textContent = `${avgDiscount.toFixed(1)}%`;
        document.getElementById('topBrand').textContent = topBrand;

        // 테이블 렌더링
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        items.forEach((item, index) => {
            const tr = document.createElement('tr');
            
            let displayTitle = item.title || "이름 없음";
            if (displayTitle.length > 40) displayTitle = displayTitle.substring(0, 37) + "...";

            const priceNum = parseInt(item.price) || 0;

            tr.innerHTML = `
                <td><span class="rank-badge">${item.rank || (index + 1)}</span></td>
                <td title="${item.title}">${displayTitle}</td>
                <td class="price-cell">₩ ${priceNum.toLocaleString()}</td>
            `;
            tableBody.appendChild(tr);
        });

        // 애니메이션 효과
        animateCards();

        // 5. 이미지 클릭 시 새 창에서 확대 보기 기능 추가
        setupImageClickHandlers();
    }

    function setupImageClickHandlers() {
        const images = document.querySelectorAll('.gallery-item img');
        images.forEach(img => {
            img.style.cursor = 'pointer';
            img.title = '클릭하면 크게 볼 수 있습니다';
            img.addEventListener('click', () => {
                window.open(img.src, '_blank');
            });
        });
    }

    function animateCards() {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }
});
