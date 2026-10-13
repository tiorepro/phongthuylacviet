# Phong Thủy & Huyền Không Phi Tinh - TIEN.TQN

Mở `index.html` bằng trình duyệt là chạy, không cần máy chủ và không cần cài gì.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Khung trang: thanh tab, phần HTML của 4 tab, thứ tự nạp CSS và JS |
| `css/base.css` | Màu, nền, thanh tab, thông báo nhỏ |
| `css/phong-thuy-lac-viet.css` | Giao diện tab 1 (mọi luật bắt đầu bằng `#tab-pt`) |
| `css/huyen-khong.css` | Giao diện tab 2 (mọi luật bắt đầu bằng `#tab-hk`) |
| `css/dinh-tam-cong-cu-ve.css` | Chỉnh khung cho tab 3 và tab 4 |
| `js/phong-thuy-lac-viet.js` | Tab 1: Bát Trạch, Hoá Khí, Bảo Châu, Phiên tinh phòng, bảng Động thổ / Cưới hỏi |
| `js/huyen-khong.js` | Tab 2: Huyền Không Phi Tinh, vùng xấu, cung động thổ được (hình cái cuốc) |
| `js/dinh-tam-module.js` | Tab 3: Định Tâm và Phân Cung (module nguyên bản, xem ghi chú bên dưới) |
| `js/cong-cu-ve-module.js` | Tab 4: Công cụ vẽ (module nguyên bản) |
| `js/main.js` | Chuyển tab, nối các module với nhau, gắn module vào trang |
| `tools/build-single.py` | Gộp tất cả thành một file HTML duy nhất |

Thứ tự nạp script (trong `index.html`) phải giữ nguyên: tab 1, tab 2, Định Tâm, Công cụ vẽ, cuối cùng `main.js`.

## Thay module mới

Chép đè `js/dinh-tam-module.js` hoặc `js/cong-cu-ve-module.js` bằng bản mới là xong. Hai file này không bị sửa gì
so với bản gốc; mọi chỗ ghép nối nằm trong `main.js`.

## Các tab nói chuyện với nhau thế nào

Qua sự kiện trên `document` (do hai module tự định nghĩa, `main.js` chỉ lắng nghe để chuyển tab):

- `tientqn:dinhtam:send`: Định Tâm gửi Hướng sang tab 1 hoặc tab 2 (điền ô Hướng rồi vẽ lại).
- `tientqn:dinhtam:to-draw`: Định Tâm gửi khu đất và nhà sang Công cụ vẽ.
- `tientqn:draw:send`: Công cụ vẽ gửi bản vẽ về Định Tâm.

Dữ liệu nhập của tab 3 và tab 4 tự lưu trong `localStorage` của trình duyệt.

## Ghi chú kỹ thuật

- Công cụ vẽ chỉ được gắn vào trang khi mở tab 4 lần đầu, để đo đúng kích thước khung.
- Công cụ vẽ gắn phím tắt vào `window`; `main.js` bọc lại để các phím đó chỉ chạy khi đang ở tab 4.
- Quét PDF và OCR trong Định Tâm tải thư viện từ CDN nên cần mạng; các chức năng còn lại chạy offline.

## Gộp một file

```
python3 tools/build-single.py
```
tạo `dist/phong-thuy-tong-hop.html`: một file duy nhất, mở được ở bất kỳ đâu.
