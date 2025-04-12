'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/shared/product-card';
import { searchProducts } from '@/services/modules/product.service';
import type { ProductRes } from '@/services/types/response/product_types/product.res';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PaginationWrapper } from '@/components/custom/pagination-wrapper';
import {
  Breadcrumb,
  type BreadcrumbItem,
} from '@/components/custom/breadcrumb';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const pageParam = searchParams.get('page');
  const page = pageParam ? parseInt(pageParam) : 1;

  const [products, setProducts] = useState<ProductRes[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(query);

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const response = await searchProducts({
        name: query,
        page: currentPage,
        size: 12,
      });

      setProducts(response.products || []);
      setTotalItems(response.total || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
  }, [query, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.history.pushState({}, '', url);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      // Cập nhật URL với tham số tìm kiếm mới
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchValue);
      url.searchParams.delete('page');
      window.history.pushState({}, '', url);
      // Đặt lại trang về 1 và tìm kiếm với giá trị mới
      setCurrentPage(1);
      fetchSearchResults();
    }
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tìm kiếm', href: '/search' },
  ];

  if (query) {
    breadcrumbItems.push({
      label: `Kết quả cho "${query}"`,
      href: `/search?q=${query}`,
      active: true,
    });
  }

  return (
    <div className='container-custom py-6'>
      <Breadcrumb items={breadcrumbItems} />

      <div className='flex flex-col md:flex-row gap-6 mt-6'>
        {/* Sidebar with search form */}
        <div className='w-full md:w-64 flex-shrink-0'>
          <Card>
            <CardHeader>
              <CardTitle>Tìm kiếm</CardTitle>
              <CardDescription>Tìm sản phẩm theo tên</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className='space-y-4'>
                <div className='flex space-x-2'>
                  <Input
                    placeholder='Tên sản phẩm...'
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                  <Button type='submit' size='icon'>
                    <Search className='h-4 w-4' />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className='flex-1'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold mb-2'>
              {query ? `Kết quả tìm kiếm cho "${query}"` : 'Tìm kiếm sản phẩm'}
            </h1>
            <p className='text-muted-foreground'>
              {isLoading
                ? 'Đang tìm kiếm...'
                : totalItems > 0
                ? `Tìm thấy ${totalItems} sản phẩm`
                : 'Không tìm thấy sản phẩm nào'}
            </p>
          </div>

          {isLoading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className='h-80 bg-muted/30 rounded-md animate-pulse'
                ></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id.toString()}
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    image={
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : '/placeholder.svg?height=300&width=300'
                    }
                    rating={product.rating || 0}
                    category={product.type}
                    is_sale={product.is_sale || false}
                    sale_price={product.sale_price || 0}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className='mt-10 flex justify-center'>
                  <PaginationWrapper
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={12}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : query ? (
            <div className='text-center py-10'>
              <p className='text-lg font-medium'>
                Không tìm thấy sản phẩm nào phù hợp.
              </p>
              <p className='text-muted-foreground mt-1'>
                Hãy thử tìm kiếm với từ khóa khác.
              </p>
            </div>
          ) : (
            <div className='text-center py-10'>
              <p className='text-lg font-medium'>
                Nhập từ khóa tìm kiếm để bắt đầu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
