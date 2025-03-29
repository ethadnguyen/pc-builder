'use client';

import { useState, useEffect } from 'react';
import { configurationService } from '@/services/modules/configuration.service';
import { ConfigurationRes } from '@/services/types/response/configuration_types/configuration.res';
import { ConfigurationListRes } from '@/services/types/response/configuration_types/configuration-list.res';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Edit, ShoppingCart, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PaginationWrapper } from '@/components/custom/pagination-wrapper';

export default function ConfigurationsPage() {
  const [userConfigs, setUserConfigs] = useState<ConfigurationRes[]>([]);
  const [publicConfigs, setPublicConfigs] = useState<ConfigurationRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [publicCurrentPage, setPublicCurrentPage] = useState(1);
  const [userTotalItems, setUserTotalItems] = useState(0);
  const [publicTotalItems, setPublicTotalItems] = useState(0);
  const pageSize = 5; // Số lượng cấu hình trên mỗi trang
  const { toast } = useToast();
  const router = useRouter();

  const calculateTotalPrice = (config: ConfigurationRes) => {
    return config.total_price || 0;
  };

  const loadUserConfigurations = async (page = 1) => {
    try {
      setLoading(true);
      const response = await configurationService.getUserConfigurations({
        page,
        size: pageSize,
      });
      console.log('configurations', response);
      setUserConfigs(response.configurations);
      setUserTotalItems(response.total);
      setUserCurrentPage(Number(response.currentPage) || 1);
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách cấu hình.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPublicConfigurations = async (page = 1) => {
    try {
      const response = await configurationService.getPublicConfigurations({
        page,
        size: pageSize,
      });
      setPublicConfigs(response.configurations);
      setPublicTotalItems(response.total);
      setPublicCurrentPage(Number(response.currentPage) || 1);
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách cấu hình công khai.',
      });
    }
  };

  // Xóa cấu hình
  const handleDeleteConfig = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa cấu hình này?')) {
      try {
        await configurationService.deleteConfiguration(id);
        // Tải lại danh sách sau khi xóa để cập nhật phân trang
        loadUserConfigurations(userCurrentPage);
        toast({
          title: 'Thành công',
          description: 'Đã xóa cấu hình.',
        });
      } catch (_error) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể xóa cấu hình.',
        });
      }
    }
  };

  // Chuyển cấu hình vào giỏ hàng
  const handleMoveToCart = async (id: number) => {
    try {
      await configurationService.moveToCart(id);
      toast({
        title: 'Thành công',
        description: 'Đã chuyển cấu hình vào giỏ hàng.',
      });
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể chuyển cấu hình vào giỏ hàng.',
      });
    }
  };

  const handleUserPageChange = (page: number) => {
    loadUserConfigurations(page);
  };

  const handlePublicPageChange = (page: number) => {
    loadPublicConfigurations(page);
  };

  useEffect(() => {
    loadUserConfigurations();
    loadPublicConfigurations();
  }, []);

  const renderComponents = (config: ConfigurationRes) => {
    if (!config.component_ids || !Array.isArray(config.component_ids)) {
      return (
        <div className='text-sm text-muted-foreground'>
          Không có thông tin linh kiện
        </div>
      );
    }

    const groupedComponents: {
      [key: string]: (typeof config.component_ids)[0][];
    } = {};

    config.component_ids.forEach((component) => {
      if (!groupedComponents[component.product_type]) {
        groupedComponents[component.product_type] = [];
      }
      groupedComponents[component.product_type].push(component);
    });

    return (
      <div className='space-y-4'>
        <div>
          <h3 className='text-sm font-medium mb-2'>Danh sách linh kiện:</h3>
          {Object.entries(groupedComponents).map(([type, components]) => (
            <div key={type} className='mb-2'>
              <div className='text-sm font-medium'>{type}</div>
              {components.map((component, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 text-sm text-muted-foreground pl-2'
                >
                  <div>{component.product.name}</div>
                  <div className='text-xs'>
                    ({component.product.price.toLocaleString()}đ)
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {config.compatibility_result && (
          <div>
            <h3 className='text-sm font-medium mb-2'>
              Kết quả kiểm tra tương thích:
            </h3>
            <div className='space-y-2'>
              {config.compatibility_result.messages.map((message, index) => (
                <div key={index} className='text-sm text-muted-foreground'>
                  {message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='container-custom py-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Cấu hình PC của tôi</h1>
        <Link href='/builder'>
          <Button>
            <Plus className='h-4 w-4 mr-2' />
            Tạo cấu hình mới
          </Button>
        </Link>
      </div>

      <Tabs defaultValue='my-configs' className='w-full'>
        <TabsList className='mb-6'>
          <TabsTrigger value='my-configs'>Cấu hình của tôi</TabsTrigger>
          <TabsTrigger value='public-configs'>Cấu hình công khai</TabsTrigger>
        </TabsList>

        <TabsContent value='my-configs'>
          {loading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : userConfigs && userConfigs.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {userConfigs.map((config) => (
                  <Card key={config.id} className='h-full flex flex-col'>
                    <CardHeader>
                      <div className='flex justify-between items-start'>
                        <div>
                          <CardTitle>{config.name}</CardTitle>
                          <CardDescription>
                            {config.description}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={config.is_public ? 'default' : 'outline'}
                        >
                          {config.is_public ? 'Công khai' : 'Riêng tư'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className='flex-grow'>
                      {renderComponents(config)}
                      <div className='mt-4 font-semibold text-right'>
                        Tổng giá: {calculateTotalPrice(config).toLocaleString()}
                        đ
                      </div>
                    </CardContent>
                    <CardFooter className='flex justify-between'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Xóa
                      </Button>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            router.push(`/builder?config=${config.id}`)
                          }
                        >
                          <Edit className='h-4 w-4 mr-2' />
                          Sửa
                        </Button>
                        <Button
                          size='sm'
                          onClick={() => handleMoveToCart(config.id)}
                        >
                          <ShoppingCart className='h-4 w-4 mr-2' />
                          Mua
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div className='mt-6'>
                <PaginationWrapper
                  currentPage={userCurrentPage}
                  totalItems={userTotalItems}
                  pageSize={pageSize}
                  onPageChange={handleUserPageChange}
                />
              </div>
            </>
          ) : (
            <div className='text-center py-12 bg-muted rounded-lg'>
              <p className='text-lg mb-4'>Bạn chưa có cấu hình PC nào.</p>
              <Link href='/builder'>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Tạo cấu hình mới
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value='public-configs'>
          {loading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : publicConfigs && publicConfigs.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {publicConfigs.map((config) => (
                  <Card key={config.id} className='h-full flex flex-col'>
                    <CardHeader>
                      <CardTitle>{config.name}</CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </CardHeader>
                    <CardContent className='flex-grow'>
                      {renderComponents(config)}
                      <div className='mt-4 font-semibold text-right'>
                        Tổng giá: {calculateTotalPrice(config).toLocaleString()}
                        đ
                      </div>
                    </CardContent>
                    <CardFooter className='flex justify-end'>
                      <Button
                        size='sm'
                        onClick={() =>
                          router.push(`/builder?config=${config.id}`)
                        }
                      >
                        <Edit className='h-4 w-4 mr-2' />
                        Xem chi tiết
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div className='mt-6'>
                <PaginationWrapper
                  currentPage={publicCurrentPage}
                  totalItems={publicTotalItems}
                  pageSize={pageSize}
                  onPageChange={handlePublicPageChange}
                />
              </div>
            </>
          ) : (
            <div className='text-center py-12 bg-muted rounded-lg'>
              <p className='text-lg'>Chưa có cấu hình công khai nào.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
