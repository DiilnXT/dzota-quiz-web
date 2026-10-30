import React from 'react';
import type { Metadata } from 'next';
import DuocLyClient from './DuocLyClient';

export const metadata: Metadata = {
  title: 'Tra Cứu Dược Lý Lâm Sàng 401 Thuốc | Bản quyền Nhật Duy - Dzota.Edu',
  description: 'Công cụ tra cứu nhanh 401 thuốc, phân nhóm phổ, biệt dược, hoạt chất - tá dược, chỉ định, chống chỉ định, thời điểm dùng và tương tác lâm sàng. Soạn bởi Nhật Duy Y Khoa K26.',
  keywords: ['dược lý', 'tra cứu thuốc', 'hoạt chất', 'biệt dược', 'tá dược', 'dược thư', 'nhật duy', 'dzota duocly'],
  openGraph: {
    title: 'Tra Cứu Dược Lý Lâm Sàng 401 Thuốc - Dzota.Edu',
    description: 'Bảng tra cứu 401 thuốc Y khoa toàn diện: Nhóm, phổ, hoạt chất, tá dược, chỉ định, chống chỉ định, thời điểm dùng. Bản quyền Nhật Duy.',
    locale: 'vi_VN',
    type: 'website',
  }
};

export default function DuocLyPage() {
  return <DuocLyClient />;
}
