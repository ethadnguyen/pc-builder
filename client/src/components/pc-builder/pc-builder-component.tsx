'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PCBuilderItem } from './pc-builder-item';
import { PCBuilderDroppable } from './pc-builder-droppable';
import { PCBuilderDraggable } from './pc-builder-draggable';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { getActiveProducts } from '@/services/modules/product.service';
import { compatibilityService } from '@/services/modules/compatibility.service';
import { CompatibilityRequest } from '@/services/types/request/compatibility_types/compatibility.req';
import {
  CompatibilityResponse,
  CompatibilityMessage,
} from '@/services/types/response/compatibility_types/compatibility.res';
import { getActiveBrands } from '@/services/modules/brand.service';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BrandRes } from '@/services/types/response/brand_types/brand.res';
import { configurationService } from '@/services/modules/configuration.service';
import { CreateConfigurationReq } from '@/services/types/request/configuration_types/create-configuration.req';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ProductRes,
  ProductType,
} from '@/services/types/response/product_types/product.res';
import { PaginationWrapper } from '@/components/custom/pagination-wrapper';

interface Component {
  id: string;
  type: string;
  name: string;
  image: string;
  price: number;
  compatibility: string[];
  brand?: BrandRes;
}

const componentTypes = [
  { id: 'CPU', name: 'CPU', allowMultiple: false },
  { id: 'MAINBOARD', name: 'Mainboard', allowMultiple: false },
  { id: 'RAM', name: 'RAM', allowMultiple: true },
  { id: 'GPU', name: 'VGA', allowMultiple: false },
  { id: 'STORAGE', name: 'Ổ cứng', allowMultiple: true },
  { id: 'POWER_SUPPLY', name: 'Nguồn', allowMultiple: false },
  { id: 'CASE', name: 'Vỏ case', allowMultiple: false },
  { id: 'COOLING', name: 'Tản nhiệt', allowMultiple: false },
];

// Ánh xạ từ loại component trong UI sang loại sản phẩm trong API
const componentTypeMapping: { [key: string]: string } = {
  CPU: 'CPU',
  MAINBOARD: 'MAINBOARD',
  RAM: 'RAM',
  GPU: 'GPU',
  STORAGE: 'STORAGE',
  POWER_SUPPLY: 'POWER_SUPPLY',
  CASE: 'CASE',
  COOLING: 'COOLING',
};

// Dialog để lưu cấu hình
interface SaveConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description: string, isPublic: boolean) => void;
  initialData?: {
    name: string;
    description: string;
    isPublic: boolean;
  };
}

function SaveConfigDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: SaveConfigDialogProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(
    initialData?.description || ''
  );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setIsPublic(initialData.isPublic);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, description, isPublic);
    onOpenChange(false);
    // Reset form
    setName('');
    setDescription('');
    setIsPublic(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Lưu cấu hình</DialogTitle>
          <DialogDescription>
            Nhập thông tin để lưu cấu hình của bạn.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Tên cấu hình</Label>
              <Input
                id='name'
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description'>Mô tả</Label>
              <Textarea
                id='description'
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
              />
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='is-public'
                checked={isPublic}
                onCheckedChange={(checked: boolean) => setIsPublic(checked)}
              />
              <Label htmlFor='is-public'>Công khai cấu hình này</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type='submit'>Lưu cấu hình</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PCBuilderComponent() {
  const { toast } = useToast();
  const [selectedComponents, setSelectedComponents] = useState<{
    [key: string]: Component | Component[] | null;
  }>({
    CPU: null,
    MAINBOARD: null,
    RAM: [],
    GPU: null,
    STORAGE: [],
    POWER_SUPPLY: null,
    CASE: null,
    COOLING: null,
  });

  const [compatibilityMessages, setCompatibilityMessages] = useState<
    CompatibilityMessage[]
  >([]);
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableComponents, setAvailableComponents] = useState<Component[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [compatibilityResult, setCompatibilityResult] = useState<{
    messages: string[];
    isCompatible: boolean;
  } | null>(null);

  // State cho bộ lọc
  const [brands, setBrands] = useState<BrandRes[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000000]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [selectedComponentType, setSelectedComponentType] =
    useState<string>('');

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [configId, setConfigId] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Thêm state cho phân trang sản phẩm
  const [currentProductPage, setCurrentProductPage] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const productsPerPage = 8; // Số lượng sản phẩm trên mỗi trang

  // Thêm state cho phân trang slot builder
  const [currentSlotPage, setCurrentSlotPage] = useState<number>(1);
  const slotsPerPage = 4; // Số lượng slot trên mỗi trang
  const totalSlotPages = Math.ceil(componentTypes.length / slotsPerPage);

  const [showCompatibilityMessages, setShowCompatibilityMessages] =
    useState<boolean>(true);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const apiParams: {
        is_active: boolean;
        search?: string;
        min_price?: number;
        max_price?: number;
        brands?: string;
        type?: string;
        page?: number;
        size?: number;
      } = {
        is_active: true,
        search: debouncedSearchTerm || undefined,
        page: currentProductPage,
        size: productsPerPage,
      };

      if (priceRange[0] > 0) {
        apiParams.min_price = priceRange[0];
      }

      if (priceRange[1] < 20000000) {
        apiParams.max_price = priceRange[1];
      }

      if (selectedBrands.length > 0) {
        apiParams.brands = selectedBrands.join(',');
      }

      if (selectedComponentType) {
        apiParams.type = componentTypeMapping[selectedComponentType];
      }

      const productsData = await getActiveProducts(apiParams);
      console.log(productsData);

      setTotalProducts(productsData.total || 0);

      const components: Component[] = productsData.products.map(
        (product: ProductRes) => ({
          id: product.id.toString(),
          type: product.type,
          name: product.name,
          image:
            product.images && product.images.length > 0
              ? product.images[0]
              : '',
          price: product.price,
          compatibility: Array.isArray(product.specifications?.compatibility)
            ? product.specifications.compatibility
            : [],
          brand: product.brand,
        })
      );

      setAvailableComponents(components);
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách sản phẩm',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const brandsData = await getActiveBrands();
      setBrands(brandsData.brands || []);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách thương hiệu:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thương hiệu',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadProducts();
  }, [
    debouncedSearchTerm,
    priceRange,
    selectedBrands,
    selectedComponentType,
    currentProductPage,
  ]);

  // Lấy danh sách thương hiệu từ API
  useEffect(() => {
    loadBrands();
  }, []);

  // Tính tổng tiền
  useEffect(() => {
    let newTotalPrice = 0;

    for (const [, value] of Object.entries(selectedComponents)) {
      if (value === null) continue;

      if (Array.isArray(value)) {
        // Tính tổng giá cho các thành phần có nhiều sản phẩm (RAM, Storage)
        newTotalPrice += value.reduce(
          (sum, comp) => sum + (comp?.price || 0),
          0
        );
      } else {
        // Tính giá cho các thành phần chỉ có một sản phẩm
        newTotalPrice += value.price || 0;
      }
    }

    setTotalPrice(newTotalPrice);
  }, [selectedComponents]);

  const checkCompatibility = async (
    selectedIds?: { product_id: string | number; product_type: ProductType }[]
  ) => {
    let compatibilityRequest: CompatibilityRequest;

    if (selectedIds) {
      compatibilityRequest = {
        products: selectedIds.map((item) => ({
          product_id:
            typeof item.product_id === 'string'
              ? parseInt(item.product_id)
              : item.product_id,
          product_type: item.product_type,
        })),
      };
    } else {
      const selectedComponentsList: {
        product_id: number;
        product_type: ProductType;
      }[] = [];

      Object.entries(selectedComponents).forEach(([type, component]) => {
        if (component === null) return;

        if (Array.isArray(component)) {
          // Xử lý các thành phần có nhiều sản phẩm (RAM, Storage)
          component.forEach((item) => {
            selectedComponentsList.push({
              product_id: parseInt(item.id),
              product_type: componentTypeMapping[type] as ProductType,
            });
          });
        } else {
          // Xử lý các thành phần chỉ có một sản phẩm
          selectedComponentsList.push({
            product_id: parseInt(component.id),
            product_type: componentTypeMapping[type] as ProductType,
          });
        }
      });

      if (selectedComponentsList.length < 2) {
        setCompatibilityMessages([]);
        setIsCompatible(true);
        return;
      }

      compatibilityRequest = {
        products: selectedComponentsList,
      };
    }

    try {
      const response: CompatibilityResponse =
        await compatibilityService.checkCompatibility(compatibilityRequest);

      setCompatibilityMessages(response.messages);
      setIsCompatible(response.isCompatible);
    } catch (error) {
      console.error('Lỗi khi kiểm tra tương thích:', error);
      setCompatibilityMessages([
        {
          type: 'error',
          text: 'Đã xảy ra lỗi khi kiểm tra tương thích. Vui lòng thử lại sau.',
        },
      ]);
      setIsCompatible(false);
    }
  };

  // Kiểm tra tương thích khi thay đổi thành phần
  useEffect(() => {
    checkCompatibility();
  }, [selectedComponents]);

  useEffect(() => {
    // Kiểm tra nếu có tham số config trong URL
    const configParam = searchParams.get('config');
    if (configParam) {
      loadConfigurationById(parseInt(configParam));
    }
  }, [searchParams]);

  // Tải cấu hình từ ID
  const loadConfigurationById = async (id: number) => {
    try {
      const config = await configurationService.getConfigurationById(id);
      if (!config) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không tìm thấy cấu hình.',
        });
        return;
      }

      setConfigId(config.id);

      setSelectedComponents({
        CPU: null,
        GPU: null,
        MAINBOARD: null,
        RAM: [],
        POWER_SUPPLY: null,
        CASE: null,
        COOLING: null,
        STORAGE: [],
      });

      if (config.component_ids && Array.isArray(config.component_ids)) {
        config.component_ids.forEach((component) => {
          const type = component.product_type;
          const productComponent: Component = {
            id: component.product.id.toString(),
            type: component.product.type,
            name: component.product.name,
            image: component.product.images?.[0] || '',
            price: component.product.price,
            compatibility: Array.isArray(
              component.product.specifications?.compatibility
            )
              ? component.product.specifications.compatibility
              : [],
            brand: component.product.brand,
          };

          if (type === 'RAM' || type === 'STORAGE') {
            // Xử lý các linh kiện có thể chọn nhiều
            setSelectedComponents((prev) => ({
              ...prev,
              [type]: [
                ...(Array.isArray(prev[type]) ? prev[type] : []),
                productComponent,
              ],
            }));
          } else {
            // Xử lý các linh kiện chỉ chọn một
            setSelectedComponents((prev) => ({
              ...prev,
              [type]: productComponent,
            }));
          }
        });
      }

      setName(config.name);
      setDescription(config.description);
      setIsPublic(config.is_public);

      if (config.compatibility_result) {
        setCompatibilityResult(config.compatibility_result);
      }

      toast({
        title: 'Thành công',
        description: 'Đã tải cấu hình.',
      });
    } catch (error) {
      console.error('Lỗi khi tải cấu hình:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải cấu hình.',
      });
    }
  };

  // Kiểm tra tương thích sau khi tải cấu hình (để sử dụng trong tương lai)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkCompatibilityAfterLoading = (components: {
    [key: string]: Component | Component[] | null;
  }) => {
    const selectedIds: {
      product_id: number;
      product_type: ProductType;
    }[] = [];

    Object.entries(components).forEach(([, component]) => {
      if (component === null) return;

      if (Array.isArray(component)) {
        component.forEach((item) => {
          selectedIds.push({
            product_id: parseInt(item.id),
            product_type: item.type as ProductType,
          });
        });
      } else {
        selectedIds.push({
          product_id: parseInt(component.id),
          product_type: component.type as ProductType,
        });
      }
    });

    if (selectedIds.length >= 2) {
      checkCompatibility(selectedIds);
    }
  };

  const handleSaveConfiguration = async (
    name: string,
    description: string,
    isPublic: boolean
  ) => {
    try {
      const selectedComponentIds: {
        product_id: number;
        product_type: ProductType;
      }[] = [];

      Object.entries(selectedComponents).forEach(([type, component]) => {
        if (component === null) return;

        if (Array.isArray(component)) {
          component.forEach((item) => {
            selectedComponentIds.push({
              product_id: parseInt(item.id),
              product_type: componentTypeMapping[type] as ProductType,
            });
          });
        } else {
          selectedComponentIds.push({
            product_id: parseInt(component.id),
            product_type: componentTypeMapping[type] as ProductType,
          });
        }
      });

      if (selectedComponentIds.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Vui lòng chọn ít nhất một linh kiện để lưu cấu hình.',
        });
        return;
      }

      if (configId) {
        const updateData = {
          id: configId,
          name,
          description,
          component_ids: selectedComponentIds,
          is_public: isPublic,
        };

        await configurationService.updateConfiguration(updateData);
        toast({
          title: 'Thành công',
          description: 'Cấu hình đã được cập nhật.',
        });
      } else {
        const saveData: CreateConfigurationReq = {
          name,
          description,
          component_ids: selectedComponentIds,
          is_public: isPublic,
        };

        const savedConfig = await configurationService.createConfiguration(
          saveData
        );
        setConfigId(savedConfig.id);
        toast({
          title: 'Thành công',
          description: 'Cấu hình đã được lưu.',
        });
      }
    } catch (error) {
      console.error('Lỗi khi lưu cấu hình:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lưu cấu hình.',
      });
    }
  };

  // Mua cấu hình hiện tại
  const handleBuyConfiguration = async () => {
    if (configId) {
      try {
        await configurationService.moveToCart(configId);
        toast({
          title: 'Thành công',
          description: 'Cấu hình đã được chuyển vào giỏ hàng.',
        });
        router.push('/cart');
      } catch (error) {
        console.error('Lỗi khi chuyển cấu hình vào giỏ hàng:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể chuyển cấu hình vào giỏ hàng.',
        });
      }
    } else {
      setSaveDialogOpen(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const component = availableComponents.find(
        (comp) => Number(comp.id) === Number(active.id)
      );

      const targetType = over.id.toString();
      const componentTypeInfo = componentTypes.find(
        (type) => type.id === targetType
      );

      if (component && targetType && componentTypeInfo) {
        if (component.type === targetType) {
          const newSelectedComponents = { ...selectedComponents };

          if (componentTypeInfo.allowMultiple) {
            const currentComponents =
              (newSelectedComponents[targetType] as Component[]) || [];
            newSelectedComponents[targetType] = [
              ...currentComponents,
              component,
            ];
          } else {
            newSelectedComponents[targetType] = component;
          }

          setSelectedComponents(newSelectedComponents);
        } else {
          toast({
            title: 'Không thể thêm linh kiện',
            description: `Linh kiện này không phải là ${componentTypeInfo.name}`,
            variant: 'destructive',
          });
        }
      }
    }
  };

  const handleRemoveComponent = (type: string, index?: number) => {
    const componentTypeInfo = componentTypes.find((t) => t.id === type);
    const newSelectedComponents = { ...selectedComponents };

    if (componentTypeInfo?.allowMultiple && typeof index === 'number') {
      const components = newSelectedComponents[type] as Component[];
      if (components && components.length > 0) {
        const newComponents = [...components];
        newComponents.splice(index, 1);
        newSelectedComponents[type] =
          newComponents.length > 0 ? newComponents : [];
      }
    } else {
      newSelectedComponents[type] = componentTypeInfo?.allowMultiple
        ? []
        : null;
    }

    setSelectedComponents(newSelectedComponents);
  };

  const handleBrandChange = (brandName: string) => {
    setSelectedBrands((prev) => {
      if (prev.includes(brandName)) {
        return prev.filter((b) => b !== brandName);
      } else {
        return [...prev, brandName];
      }
    });
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleComponentTypeChange = (value: string) => {
    setSelectedComponentType(value === 'all' ? '' : value);
  };

  const handleProductPageChange = (page: number) => {
    setCurrentProductPage(page);
  };

  const handleSlotPageChange = (page: number) => {
    setCurrentSlotPage(page);
  };

  const getCurrentSlots = () => {
    const startIndex = (currentSlotPage - 1) * slotsPerPage;
    const endIndex = startIndex + slotsPerPage;
    return componentTypes.slice(startIndex, endIndex);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
        <div className='lg:col-span-1'>
          <div className='bg-card rounded-lg border p-4'>
            <h3 className='font-medium mb-4'>Tìm kiếm</h3>
            <div className='relative'>
              <input
                type='text'
                placeholder='Tìm linh kiện...'
                value={searchTerm}
                onChange={handleSearchChange}
                className='w-full p-2 border rounded-md'
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className='bg-card rounded-lg border p-4 mt-4'>
            <h3 className='font-medium mb-4'>Loại linh kiện</h3>
            <Select
              value={
                selectedComponentType === '' ? 'all' : selectedComponentType
              }
              onValueChange={handleComponentTypeChange}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chọn loại linh kiện' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                {componentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='bg-card rounded-lg border p-4 mt-4'>
            <h3 className='font-medium mb-4'>Khoảng giá</h3>
            <div className='px-2'>
              <Slider
                defaultValue={priceRange}
                max={20000000}
                step={500000}
                onValueChange={handlePriceRangeChange}
                className='mb-6'
              />
              <div className='flex justify-between text-sm'>
                <span>{priceRange[0].toLocaleString()}đ</span>
                <span>{priceRange[1].toLocaleString()}đ</span>
              </div>
            </div>
          </div>

          <div className='bg-card rounded-lg border p-4 mt-4'>
            <h3 className='font-medium mb-4'>Thương hiệu</h3>
            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {brands.map((brand) => (
                <div key={brand.id} className='flex items-center'>
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={selectedBrands.includes(brand.name)}
                    onCheckedChange={() => handleBrandChange(brand.name)}
                  />
                  <label
                    htmlFor={`brand-${brand.id}`}
                    className='ml-2 text-sm font-medium'
                  >
                    {brand.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phần builder slots ở giữa */}
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-card rounded-lg border p-6'>
            <h2 className='text-2xl font-bold mb-6'>Xây dựng cấu hình PC</h2>

            {compatibilityMessages.length > 0 && (
              <div className='mb-6'>
                <div
                  className='flex items-center justify-between bg-muted p-2 rounded-t-md cursor-pointer'
                  onClick={() =>
                    setShowCompatibilityMessages(!showCompatibilityMessages)
                  }
                >
                  <span className='font-medium'>
                    Thông tin tương thích ({compatibilityMessages.length})
                  </span>
                  <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                    {showCompatibilityMessages ? (
                      <ChevronUp className='h-4 w-4' />
                    ) : (
                      <ChevronDown className='h-4 w-4' />
                    )}
                  </Button>
                </div>

                {showCompatibilityMessages && (
                  <div className='space-y-3 max-h-[300px] overflow-y-auto pr-2 pt-2'>
                    {compatibilityMessages.map((message, index) => {
                      // Hiển thị messages với kiểu khác nhau
                      if (message.type === 'error') {
                        return (
                          <Alert key={index} variant='destructive'>
                            <div className='flex items-start gap-2'>
                              <Badge
                                variant='destructive'
                                className='h-5 min-w-[80px] flex justify-center items-center'
                              >
                                Lỗi
                              </Badge>
                              <div className='flex-1'>
                                <AlertTitle>Lỗi tương thích</AlertTitle>
                                <AlertDescription>
                                  {message.text}
                                </AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        );
                      } else if (message.type === 'warning') {
                        return (
                          <Alert
                            key={index}
                            variant='default'
                            className='bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                          >
                            <div className='flex items-start gap-2'>
                              <Badge
                                variant='default'
                                className='h-5 min-w-[80px] flex justify-center items-center'
                              >
                                Cảnh báo
                              </Badge>
                              <div className='flex-1'>
                                <AlertTitle>Cảnh báo</AlertTitle>
                                <AlertDescription>
                                  {message.text}
                                </AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        );
                      } else {
                        return (
                          <Alert
                            key={index}
                            variant='default'
                            className='bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          >
                            <div className='flex items-start gap-2'>
                              <Badge
                                variant='secondary'
                                className='h-5 min-w-[80px] flex justify-center items-center'
                              >
                                Thông tin
                              </Badge>
                              <div className='flex-1'>
                                <AlertTitle>Thông tin</AlertTitle>
                                <AlertDescription>
                                  {message.text}
                                </AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            )}

            {isCompatible &&
              Object.values(selectedComponents).some(
                (value) =>
                  value !== null &&
                  (Array.isArray(value) ? value.length > 0 : true)
              ) && (
                <div className='mb-6'>
                  <div
                    className='flex items-center justify-between bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 p-2 rounded-md cursor-pointer'
                    onClick={() =>
                      setShowCompatibilityMessages(!showCompatibilityMessages)
                    }
                  >
                    <div className='flex items-center'>
                      <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400 mr-2' />
                      <span className='font-medium'>Cấu hình tương thích</span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-6 w-6 p-0 text-green-600'
                    >
                      {showCompatibilityMessages ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                    </Button>
                  </div>

                  {showCompatibilityMessages && (
                    <div className='p-4 border border-t-0 border-green-200 dark:border-green-800 rounded-b-md bg-green-50/50 dark:bg-green-950/50'>
                      <AlertDescription>
                        Các linh kiện đã chọn tương thích với nhau.
                      </AlertDescription>
                    </div>
                  )}
                </div>
              )}

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {getCurrentSlots().map((type) => {
                const componentTypeInfo = componentTypes.find(
                  (t) => t.id === type.id
                );
                const isMultiple = componentTypeInfo?.allowMultiple || false;
                const selectedComponentsForType = selectedComponents[type.id];

                return (
                  <div key={type.id} className='flex flex-col gap-2'>
                    <div className='font-medium'>
                      {type.name}
                      {isMultiple &&
                        Array.isArray(selectedComponentsForType) &&
                        selectedComponentsForType.length > 0 && (
                          <span className='ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full'>
                            {selectedComponentsForType.length}
                          </span>
                        )}
                    </div>
                    <div className='flex-1'>
                      <PCBuilderDroppable id={type.id}>
                        {!isMultiple &&
                        selectedComponentsForType &&
                        !Array.isArray(selectedComponentsForType) ? (
                          <div className='border border-primary/40 bg-primary/5 rounded-md p-1'>
                            <PCBuilderItem
                              component={selectedComponentsForType}
                              onRemove={() => handleRemoveComponent(type.id)}
                            />
                          </div>
                        ) : isMultiple &&
                          Array.isArray(selectedComponentsForType) &&
                          selectedComponentsForType.length > 0 ? (
                          // Hiển thị nhiều thành phần
                          <div className='space-y-2 max-h-[200px] overflow-y-auto p-2 border border-primary/40 bg-primary/5 rounded-md'>
                            {selectedComponentsForType.map(
                              (component, index) => (
                                <PCBuilderItem
                                  key={`${component.id}-${index}`}
                                  component={component}
                                  onRemove={() =>
                                    handleRemoveComponent(type.id, index)
                                  }
                                />
                              )
                            )}
                            <div className='text-center mt-2'>
                              <div className='text-xs text-muted-foreground'>
                                Kéo thả thêm {type.name.toLowerCase()} vào đây
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Hiển thị placeholder khi chưa có thành phần nào
                          <div className='text-muted-foreground text-sm border border-dashed border-muted-foreground/30 rounded-md p-4 h-full min-h-[80px] flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors'>
                            Kéo thả linh kiện vào đây
                          </div>
                        )}
                      </PCBuilderDroppable>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân trang cho slots */}
            {totalSlotPages > 1 && (
              <div className='mt-4'>
                <PaginationWrapper
                  currentPage={currentSlotPage}
                  totalItems={componentTypes.length}
                  pageSize={slotsPerPage}
                  onPageChange={handleSlotPageChange}
                />
              </div>
            )}
          </div>

          <div className='mt-6 flex justify-between items-center'>
            <div className='text-lg font-bold'>
              Tổng tiền: {totalPrice.toLocaleString()}đ
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setSaveDialogOpen(true)}
                disabled={
                  !Object.values(selectedComponents).some(
                    (value) =>
                      value !== null &&
                      (Array.isArray(value) ? value.length > 0 : true)
                  )
                }
              >
                Lưu cấu hình
              </Button>
              <Button
                disabled={
                  !Object.values(selectedComponents).some(
                    (value) =>
                      value !== null &&
                      (Array.isArray(value) ? value.length > 0 : true)
                  ) || !isCompatible
                }
                onClick={handleBuyConfiguration}
              >
                Mua cấu hình này
              </Button>
            </div>
          </div>
        </div>

        <div className='lg:col-span-2'>
          <div className='bg-card rounded-lg border p-6'>
            <h3 className='text-xl font-bold mb-4'>Linh kiện có sẵn</h3>
            {loading ? (
              <div className='text-center py-4'>
                Đang tải danh sách linh kiện...
              </div>
            ) : availableComponents.length > 0 ? (
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <SortableContext
                    items={availableComponents.map((comp) => comp.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {availableComponents.map((component) => (
                      <PCBuilderDraggable key={component.id} id={component.id}>
                        <div className='border rounded-md p-2 flex items-center gap-2 h-full'>
                          <div className='relative h-12 w-12 shrink-0'>
                            <img
                              src={component.image || '/placeholder.svg'}
                              alt={component.name}
                              className='object-cover rounded-md'
                            />
                          </div>
                          <div className='flex-grow'>
                            <p className='text-sm font-medium line-clamp-2'>
                              {component.name}
                            </p>
                            <div className='flex justify-between'>
                              <p className='text-xs text-muted-foreground'>
                                {component.brand?.name}
                              </p>
                              <p className='text-xs font-medium'>
                                {component.price.toLocaleString()}đ
                              </p>
                            </div>
                          </div>
                        </div>
                      </PCBuilderDraggable>
                    ))}
                  </SortableContext>
                </div>

                <div className='mt-6'>
                  <PaginationWrapper
                    currentPage={currentProductPage}
                    totalItems={totalProducts}
                    pageSize={productsPerPage}
                    onPageChange={handleProductPageChange}
                  />

                  <div className='text-sm text-center text-muted-foreground mt-2'>
                    Hiển thị {availableComponents.length} / {totalProducts} linh
                    kiện
                  </div>
                </div>
              </>
            ) : (
              <div className='text-center py-4'>
                Không tìm thấy linh kiện phù hợp.
              </div>
            )}
          </div>
        </div>
      </div>

      <SaveConfigDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveConfiguration}
        initialData={
          configId
            ? {
                name,
                description,
                isPublic,
              }
            : undefined
        }
      />
    </DndContext>
  );
}
