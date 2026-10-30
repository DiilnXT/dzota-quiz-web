export interface DrugItem {
  id: number;
  nhomPhanNhomPho: string;
  broadGroup: string;
  tenThuoc: string;
  hoatChatHamLuong: string;
  dangBaoChe: string;
  thanhPhanRaw: string;
  hoatChat: string;
  taDuoc: string;
  chiDinh: string;
  chongChiDinh: string;
  tacDungPhu: string;
  lieuDungCachDung: string;
  thoiDiemDung: string;
  nguon: string;
  ghiChu: string;
}

export type ReferenceMap = Record<string, string>;
