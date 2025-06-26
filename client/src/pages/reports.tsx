import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ReportPreview from "@/components/report-preview";
import { 
  Calendar, 
  TrendingUp, 
  Package, 
  Clock, 
  DollarSign, 
  FileDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  Download,
  Eye
} from "lucide-react";

export default function Reports() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // 필터 상태
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    vendorId: 'all',
    status: 'all',
    templateId: 'all',
    amountRange: 'all',
    userId: 'all'
  });

  const [activeFilters, setActiveFilters] = useState<typeof filters | null>(null);

  // 선택된 항목 상태
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // 보고서 생성 모달 상태
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    title: '',
    includeCharts: {
      statusDistribution: true,
      monthlyTrend: true,
      vendorAnalysis: true,
      amountAnalysis: false
    },
    chartTypes: {
      statusDistribution: 'pie',
      monthlyTrend: 'bar',
      vendorAnalysis: 'bar',
      amountAnalysis: 'bar'
    },
    summary: '',
    insights: '',
    comments: '',
    outputOptions: {
      includePdf: true,
      includeExcel: false,
      sendEmail: false
    }
  });

  // 정렬 상태
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // 정렬 함수
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬된 데이터 가져오기
  const getSortedData = (data: any[]) => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // 특별한 경우 처리
      if (sortConfig.key === 'vendor') {
        aValue = a.vendor?.name || '';
        bValue = b.vendor?.name || '';
      } else if (sortConfig.key === 'user') {
        aValue = a.user ? `${a.user.lastName || ''} ${a.user.firstName || ''}`.trim() : '';
        bValue = b.user ? `${b.user.lastName || ''} ${b.user.firstName || ''}`.trim() : '';
      } else if (sortConfig.key === 'orderDate') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (sortConfig.key === 'totalAmount') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // 정렬 아이콘 렌더링
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  // 체크박스 관련 함수들
  const handleSelectAll = (checked: boolean, orders: any[]) => {
    if (checked) {
      const allIds = new Set(orders.map(order => order.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (orderId: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedItems(newSelected);
  };

  const isAllSelected = (orders: any[]) => {
    return orders.length > 0 && orders.every(order => selectedItems.has(order.id));
  };

  const isIndeterminate = (orders: any[]) => {
    const selectedCount = orders.filter(order => selectedItems.has(order.id)).length;
    return selectedCount > 0 && selectedCount < orders.length;
  };

  // 보고서 생성 관련 함수들
  const handleReportGeneration = () => {
    const selectedOrders = processingReport?.orders?.filter((order: any) => selectedItems.has(order.id)) || [];
    const defaultTitle = `발주 현황 보고서 (${selectedOrders.length}건) - ${new Date().toLocaleDateString('ko-KR')}`;
    
    setReportConfig(prev => ({
      ...prev,
      title: defaultTitle,
      summary: generateAutoSummary(selectedOrders)
    }));
    
    setIsReportModalOpen(true);
  };

  const generateAutoSummary = (orders: any[]) => {
    if (orders.length === 0) return '';
    
    const totalAmount = orders.reduce((sum, order) => {
      const amount = parseFloat(order.totalAmount) || 0;
      return sum + amount;
    }, 0);
    const avgAmount = totalAmount / orders.length;
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topVendors = Object.entries(
      orders.reduce((acc, order) => {
        const vendorName = order.vendor?.name || '알 수 없음';
        acc[vendorName] = (acc[vendorName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 3);

    // 상태를 한국어로 변환
    const getStatusKorean = (status: string) => {
      switch (status) {
        case 'draft': return '임시 저장';
        case 'pending': return '승인 대기';
        case 'approved': return '승인 완료';
        case 'sent': return '발송됨';
        case 'completed': return '발주 완료';
        case 'rejected': return '반려';
        default: return status;
      }
    };

    return `총 ${orders.length}건의 발주 데이터를 분석한 결과:
• 총 발주 금액: ₩${Math.floor(totalAmount).toLocaleString()}
• 평균 발주 금액: ₩${Math.floor(avgAmount).toLocaleString()}
• 주요 거래처: ${topVendors.map(([name, count]) => `${name}(${count}건)`).join(', ')}
• 상태 분포: ${Object.entries(statusCounts).map(([status, count]) => `${getStatusKorean(status)}(${count}건)`).join(', ')}`;
  };

  const handleGenerateReport = async () => {
    try {
      setIsReportModalOpen(false);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "오류",
        description: "보고서 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // 페이지 보호 - 인증되지 않은 사용자 처리
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "권한 없음",
        description: "로그아웃되었습니다. 다시 로그인합니다...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // 거래처 목록
  const { data: vendors } = useQuery({
    queryKey: ["/api/vendors"],
    enabled: isAuthenticated,
  });

  // 발주 템플릿 목록
  const { data: templates } = useQuery({
    queryKey: ["/api/order-templates"],
    enabled: isAuthenticated,
  });

  // 사용자 목록
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: isAuthenticated,
  });

  // 보고서 데이터 쿼리
  const { data: processingReport, isLoading: processingLoading } = useQuery({
    queryKey: ["/api/orders", activeFilters],
    queryFn: async () => {
      if (!activeFilters) {
        return { orders: [], total: 0 };
      }
      
      const params = new URLSearchParams();
      
      if (activeFilters.year) {
        params.append('year', activeFilters.year);
      }
      if (activeFilters.startDate) {
        params.append('startDate', activeFilters.startDate);
      }
      if (activeFilters.endDate) {
        params.append('endDate', activeFilters.endDate);
      }
      if (activeFilters.vendorId && activeFilters.vendorId !== 'all') {
        params.append('vendorId', activeFilters.vendorId);
      }
      if (activeFilters.status && activeFilters.status !== 'all') {
        params.append('status', activeFilters.status);
      }
      if (activeFilters.templateId && activeFilters.templateId !== 'all') {
        params.append('templateId', activeFilters.templateId);
      }
      if (activeFilters.userId && activeFilters.userId !== 'all') {
        params.append('userId', activeFilters.userId);
      }
      
      // Set a high limit to get all data for reports
      params.append('limit', '1000');
      
      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: isAuthenticated && !!activeFilters,
  });

  const { data: monthlyReport } = useQuery({
    queryKey: ["/api/reports/monthly-summary", activeFilters?.year],
    enabled: isAuthenticated && !!activeFilters,
  });

  const { data: vendorReport } = useQuery({
    queryKey: ["/api/reports/vendor-analysis"],
    enabled: isAuthenticated && !!activeFilters,
  });

  const { data: costReport } = useQuery({
    queryKey: ["/api/reports/cost-analysis", activeFilters?.startDate, activeFilters?.endDate],
    enabled: isAuthenticated && !!activeFilters,
  });

  // Excel 내보내기 핸들러
  const handleExcelExport = async (reportType: string) => {
    try {
      const response = await fetch(`/api/reports/export-excel?type=${reportType}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportType}_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "성공",
        description: "Excel 파일이 다운로드되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "Excel 내보내기에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">보고서</h1>
          <p className="text-gray-600">발주 현황 및 통계를 확인하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsReportModalOpen(true)}
            variant="default"
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            보고서 생성
          </Button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터 조건
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">연도</label>
              <Select 
                value={filters.year} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 연도</SelectItem>
                  <SelectItem value="2025">2025년</SelectItem>
                  <SelectItem value="2024">2024년</SelectItem>
                  <SelectItem value="2023">2023년</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">시작일</label>
              <Input 
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">종료일</label>
              <Input 
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">거래처</label>
              <Select 
                value={filters.vendorId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, vendorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 거래처</SelectItem>
                  {Array.isArray(vendors) && vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">발주 상태</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="draft">임시 저장</SelectItem>
                  <SelectItem value="pending">승인 대기</SelectItem>
                  <SelectItem value="approved">승인 완료</SelectItem>
                  <SelectItem value="sent">발송됨</SelectItem>
                  <SelectItem value="completed">발주 완료</SelectItem>
                  <SelectItem value="rejected">반려</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">발주 템플릿</label>
              <Select 
                value={filters.templateId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, templateId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 템플릿</SelectItem>
                  {Array.isArray(templates) && templates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.templateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">금액 범위</label>
              <Select 
                value={filters.amountRange} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, amountRange: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 금액</SelectItem>
                  <SelectItem value="0-100000">10만원 이하</SelectItem>
                  <SelectItem value="100000-500000">10만원 ~ 50만원</SelectItem>
                  <SelectItem value="500000-1000000">50만원 ~ 100만원</SelectItem>
                  <SelectItem value="1000000-5000000">100만원 ~ 500만원</SelectItem>
                  <SelectItem value="5000000-99999999">500만원 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">담당자</label>
              <Select 
                value={filters.userId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 담당자</SelectItem>
                  {Array.isArray(users) && users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 활성 필터 표시 */}
          {activeFilters && Object.values(activeFilters).some(value => value !== 'all' && value !== '') && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">적용된 필터: </span>
                  {activeFilters.year !== new Date().getFullYear().toString() && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                      연도: {activeFilters.year}년
                    </span>
                  )}
                  {activeFilters.startDate && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                      시작일: {activeFilters.startDate}
                    </span>
                  )}
                  {activeFilters.endDate && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                      종료일: {activeFilters.endDate}
                    </span>
                  )}
                  {activeFilters.vendorId !== 'all' && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                      거래처 필터링
                    </span>
                  )}
                  {activeFilters.status !== 'all' && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                      상태: {activeFilters.status === 'pending' ? '승인 대기' : 
                            activeFilters.status === 'approved' ? '승인 완료' :
                            activeFilters.status === 'completed' ? '발주 완료' : '반려'}
                    </span>
                  )}
                  {activeFilters.templateId !== 'all' && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                      템플릿 필터링
                    </span>
                  )}
                  {activeFilters.amountRange !== 'all' && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                      금액 범위 필터링
                    </span>
                  )}
                  {activeFilters.userId !== 'all' && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                      담당자 필터링
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const resetFilters = {
                      year: new Date().getFullYear().toString(),
                      startDate: '',
                      endDate: '',
                      vendorId: 'all',
                      status: 'all',
                      templateId: 'all',
                      amountRange: 'all',
                      userId: 'all'
                    };
                    setFilters(resetFilters);
                    setActiveFilters(resetFilters);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  필터 초기화
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4 gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                const resetFilters = {
                  year: new Date().getFullYear().toString(),
                  startDate: '',
                  endDate: '',
                  vendorId: 'all',
                  status: 'all',
                  templateId: 'all',
                  amountRange: 'all',
                  userId: 'all'
                };
                setFilters(resetFilters);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              초기화
            </Button>
            <Button 
              onClick={() => {
                setActiveFilters(filters);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 검색 결과 리스트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5" />
                검색 결과
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {processingLoading ? "데이터 로딩 중..." : 
                 processingReport && processingReport.orders ? 
                 `총 ${processingReport.orders.length}건의 발주 데이터` : "검색된 데이터가 없습니다"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleReportGeneration()}
                disabled={selectedItems.size === 0}
                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
              >
                <FileText className="h-4 w-4 mr-2" />
                보고서 생성 ({selectedItems.size}건)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExcelExport('processing')}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Excel 내보내기
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!activeFilters ? (
            <div className="text-center py-16">
              <div className="text-gray-500 text-lg mb-2">검색 조건을 설정하고 검색 버튼을 클릭하세요</div>
              <div className="text-gray-400 text-sm">효율적인 성능을 위해 검색 필터를 먼저 설정해주세요</div>
            </div>
          ) : processingLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">데이터를 불러오는 중...</div>
            </div>
          ) : processingReport && Array.isArray(processingReport.orders) && processingReport.orders.length > 0 ? (
            <div className="space-y-4">
              {/* 요약 통계 */}
              <div className="space-y-4 mb-6">
                {/* 첫 번째 줄 - 기본 통계 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    const statusCounts = processingReport.orders.reduce((acc: any, order: any) => {
                      acc[order.status] = (acc[order.status] || 0) + 1;
                      return acc;
                    }, {});
                    
                    // 총 발주금액 계산
                    const totalAmount = processingReport.orders.reduce((sum: number, order: any) => {
                      const amount = parseFloat(order.totalAmount) || 0;
                      return sum + amount;
                    }, 0);
                    
                    // 평균 발주금액 계산
                    const averageAmount = processingReport.orders.length > 0 ? totalAmount / processingReport.orders.length : 0;
                    
                    return (
                      <>
                        <div className="bg-gray-50 p-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-700">{processingReport.orders.length}</div>
                          <div className="text-sm text-gray-600">총 발주</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-700">₩{Math.floor(totalAmount).toLocaleString()}</div>
                          <div className="text-sm text-blue-600">총 발주금액</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-700">₩{Math.floor(averageAmount).toLocaleString()}</div>
                          <div className="text-sm text-purple-600">평균 발주금액</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* 두 번째 줄 - 상태별 통계 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const statusCounts = processingReport.orders.reduce((acc: any, order: any) => {
                      acc[order.status] = (acc[order.status] || 0) + 1;
                      return acc;
                    }, {});
                    
                    return (
                      <>
                        <div className="bg-yellow-50 p-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-700">{statusCounts.pending || 0}</div>
                          <div className="text-sm text-yellow-600">승인 대기</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-700">{statusCounts.approved || 0}</div>
                          <div className="text-sm text-blue-600">승인 완료</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-700">{statusCounts.completed || 0}</div>
                          <div className="text-sm text-green-600">발주 완료</div>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-700">{statusCounts.rejected || 0}</div>
                          <div className="text-sm text-red-600">반려</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 데이터 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={isAllSelected(processingReport.orders || [])}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = isIndeterminate(processingReport.orders || []);
                            }
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked, processingReport.orders || [])}
                        />
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('orderNumber')}
                      >
                        <div className="flex items-center gap-1">
                          발주번호
                          {getSortIcon('orderNumber')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('vendor')}
                      >
                        <div className="flex items-center gap-1">
                          거래처
                          {getSortIcon('vendor')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('orderDate')}
                      >
                        <div className="flex items-center gap-1">
                          발주일자
                          {getSortIcon('orderDate')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('totalAmount')}
                      >
                        <div className="flex items-center gap-1">
                          총금액
                          {getSortIcon('totalAmount')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('templateName')}
                      >
                        <div className="flex items-center gap-1">
                          발주 템플릿
                          {getSortIcon('templateName')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          상태
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('user')}
                      >
                        <div className="flex items-center gap-1">
                          작성자
                          {getSortIcon('user')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(processingReport.orders).map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50 border-b border-gray-200">
                        <td className="py-3 px-4">
                          <input 
                            type="checkbox" 
                            className="rounded"
                            checked={selectedItems.has(order.id)}
                            onChange={(e) => handleSelectItem(order.id, e.target.checked)}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button
                            onClick={() => setLocation(`/order-preview/${order.id}`)}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {order.orderNumber}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {order.vendor ? (
                            <button
                              onClick={() => setLocation(`/vendors/${order.vendor.id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {order.vendor.name}
                            </button>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {order.totalAmount ? `₩${Math.floor(order.totalAmount).toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {order.templateName || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'sent' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'draft' ? '임시 저장' :
                             order.status === 'pending' ? '승인 대기' :
                             order.status === 'approved' ? '진행 중' :
                             order.status === 'sent' ? '발송됨' :
                             order.status === 'completed' ? '완료' :
                             order.status === 'rejected' ? '반려' :
                             order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {order.user ? `${order.user.lastName || ''} ${order.user.firstName || ''}`.trim() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totalAmount = processingReport.orders.reduce((sum: number, order: any) => {
                        const amount = parseFloat(order.totalAmount) || 0;
                        return sum + amount;
                      }, 0);
                      const averageAmount = processingReport.orders.length > 0 ? totalAmount / processingReport.orders.length : 0;
                      
                      return (
                        <tr className="bg-gray-100 font-medium">
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium">합계</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-bold text-blue-700">
                            ₩{Math.floor(totalAmount).toLocaleString()}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                        </tr>
                      );
                    })()}
                    {(() => {
                      const totalAmount = processingReport.orders.reduce((sum: number, order: any) => {
                        const amount = parseFloat(order.totalAmount) || 0;
                        return sum + amount;
                      }, 0);
                      const averageAmount = processingReport.orders.length > 0 ? totalAmount / processingReport.orders.length : 0;
                      
                      return (
                        <tr className="bg-gray-50 font-medium">
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium">평균</td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-bold text-purple-700">
                            ₩{Math.floor(averageAmount).toLocaleString()}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                          <td className="border border-gray-200 px-3 py-2 text-sm"></td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">검색 조건에 맞는 데이터가 없습니다.</div>
              <p className="text-sm text-gray-400 mt-2">필터 조건을 변경하여 다시 검색해보세요.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 보고서 생성 모달 */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              보고서 생성
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">기본 정보</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="reportTitle">보고서 제목</Label>
                  <Input
                    id="reportTitle"
                    value={reportConfig.title}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>선택된 데이터</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    총 {selectedItems.size}건의 발주 데이터가 선택되었습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 차트 옵션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                차트 옵션
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="statusChart"
                    checked={reportConfig.includeCharts.statusDistribution}
                    onCheckedChange={(checked) => 
                      setReportConfig(prev => ({
                        ...prev,
                        includeCharts: { ...prev.includeCharts, statusDistribution: !!checked }
                      }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="statusChart">상태별 분포</Label>
                    <p className="text-xs text-gray-600">발주 상태별 통계 차트</p>
                  </div>
                  {reportConfig.includeCharts.statusDistribution && (
                    <Select 
                      value={reportConfig.chartTypes.statusDistribution} 
                      onValueChange={(value) => 
                        setReportConfig(prev => ({
                          ...prev,
                          chartTypes: { ...prev.chartTypes, statusDistribution: value }
                        }))
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pie">파이</SelectItem>
                        <SelectItem value="donut">도넛</SelectItem>
                        <SelectItem value="bar">막대</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="monthlyChart"
                    checked={reportConfig.includeCharts.monthlyTrend}
                    onCheckedChange={(checked) => 
                      setReportConfig(prev => ({
                        ...prev,
                        includeCharts: { ...prev.includeCharts, monthlyTrend: !!checked }
                      }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="monthlyChart">월별 현황</Label>
                    <p className="text-xs text-gray-600">월별 발주 추이 차트</p>
                  </div>
                  {reportConfig.includeCharts.monthlyTrend && (
                    <Select 
                      value={reportConfig.chartTypes.monthlyTrend} 
                      onValueChange={(value) => 
                        setReportConfig(prev => ({
                          ...prev,
                          chartTypes: { ...prev.chartTypes, monthlyTrend: value }
                        }))
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">막대</SelectItem>
                        <SelectItem value="line">선형</SelectItem>
                        <SelectItem value="area">영역</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vendorChart"
                    checked={reportConfig.includeCharts.vendorAnalysis}
                    onCheckedChange={(checked) => 
                      setReportConfig(prev => ({
                        ...prev,
                        includeCharts: { ...prev.includeCharts, vendorAnalysis: !!checked }
                      }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="vendorChart">거래처별 분석</Label>
                    <p className="text-xs text-gray-600">거래처별 발주 통계</p>
                  </div>
                  {reportConfig.includeCharts.vendorAnalysis && (
                    <Select 
                      value={reportConfig.chartTypes.vendorAnalysis} 
                      onValueChange={(value) => 
                        setReportConfig(prev => ({
                          ...prev,
                          chartTypes: { ...prev.chartTypes, vendorAnalysis: value }
                        }))
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">막대</SelectItem>
                        <SelectItem value="horizontal">가로막대</SelectItem>
                        <SelectItem value="table">테이블</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="amountChart"
                    checked={reportConfig.includeCharts.amountAnalysis}
                    onCheckedChange={(checked) => 
                      setReportConfig(prev => ({
                        ...prev,
                        includeCharts: { ...prev.includeCharts, amountAnalysis: !!checked }
                      }))
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="amountChart">금액별 분석</Label>
                    <p className="text-xs text-gray-600">발주 금액 분포 차트</p>
                  </div>
                  {reportConfig.includeCharts.amountAnalysis && (
                    <Select 
                      value={reportConfig.chartTypes.amountAnalysis} 
                      onValueChange={(value) => 
                        setReportConfig(prev => ({
                          ...prev,
                          chartTypes: { ...prev.chartTypes, amountAnalysis: value }
                        }))
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">막대</SelectItem>
                        <SelectItem value="histogram">히스토그램</SelectItem>
                        <SelectItem value="box">박스플롯</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {/* 보고서 내용 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">보고서 내용</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="summary">자동 생성된 요약</Label>
                  <Textarea
                    id="summary"
                    value={reportConfig.summary}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, summary: e.target.value }))}
                    rows={4}
                    className="mt-1"
                    placeholder="데이터 기반 자동 요약이 여기에 표시됩니다..."
                  />
                </div>
                <div>
                  <Label htmlFor="insights">주요 인사이트</Label>
                  <Textarea
                    id="insights"
                    value={reportConfig.insights}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, insights: e.target.value }))}
                    rows={3}
                    className="mt-1"
                    placeholder="데이터에서 발견한 주요 패턴이나 인사이트를 입력하세요..."
                  />
                </div>
                <div>
                  <Label htmlFor="comments">추가 코멘트</Label>
                  <Textarea
                    id="comments"
                    value={reportConfig.comments}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, comments: e.target.value }))}
                    rows={2}
                    className="mt-1"
                    placeholder="추가적인 분석이나 권장사항을 입력하세요..."
                  />
                </div>
              </div>
            </div>

            {/* 출력 옵션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Download className="h-5 w-5" />
                출력 옵션
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePdf"
                    checked={reportConfig.outputOptions.includePdf}
                    onCheckedChange={(checked) => 
                      setReportConfig(prev => ({
                        ...prev,
                        outputOptions: { ...prev.outputOptions, includePdf: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="includePdf">PDF 다운로드</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeExcel"
                    checked={reportConfig.outputOptions.includeExcel}
                    onCheckedChange={(checked) => 
                      setReportConfig(prev => ({
                        ...prev,
                        outputOptions: { ...prev.outputOptions, includeExcel: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="includeExcel">Excel 데이터 첨부</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmail"
                    checked={reportConfig.outputOptions.sendEmail}
                    onCheckedChange={(checked) => 
                      setReportConfig(prev => ({
                        ...prev,
                        outputOptions: { ...prev.outputOptions, sendEmail: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="sendEmail">이메일 전송</Label>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsReportModalOpen(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleGenerateReport}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                미리보기 및 생성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 보고서 미리보기 */}
      {showPreview && (
        <ReportPreview
          config={reportConfig}
          orders={processingReport?.orders?.filter((order: any) => selectedItems.has(order.id)) || []}
          onClose={() => setShowPreview(false)}
        />
      )}

    </div>
  );
}