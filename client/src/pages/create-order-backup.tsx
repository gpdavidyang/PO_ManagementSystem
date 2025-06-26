import { useState } from "react";
import { useLocation } from "wouter";
import { OrderForm } from "@/components/order-form";
import { ExcelUpload } from "@/components/excel-upload";
import { FileText, Upload, FileSpreadsheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExcelData {
  itemName: string;
  specification: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  remarks?: string;
}

export default function CreateOrder() {
  const [, navigate] = useLocation();
  const [excelData, setExcelData] = useState<ExcelData[]>([]);
  const [uploadError, setUploadError] = useState<string>("");

  const handleSuccess = () => {
    navigate("/orders");
  };

  const handleCancel = () => {
    navigate("/orders");
  };

  const handleExcelDataParsed = (data: ExcelData[]) => {
    setExcelData(data);
    setUploadError("");
  };

  const handleExcelError = (error: string) => {
    setUploadError(error);
    setExcelData([]);
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">발주서 작성</h1>
            <p className="text-sm text-gray-600 mt-1">
              새로운 발주서를 작성하거나 Excel 파일을 업로드해주세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="form" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              일반 폼 작성
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel 업로드
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-6">
            <OrderForm 
              onSuccess={handleSuccess} 
              onCancel={handleCancel}
              initialItems={excelData}
            />
          </TabsContent>

          <TabsContent value="excel" className="mt-6">
            <div className="space-y-6">
              <ExcelUpload 
                onDataParsed={handleExcelDataParsed}
                onError={handleExcelError}
              />
              
              {uploadError && (
                <Alert variant="destructive">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {excelData.length > 0 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Excel 데이터를 불러왔습니다. "일반 폼 작성" 탭으로 이동하여 발주서를 완성해주세요.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">미리보기 ({excelData.length}개 품목)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3">품목명</th>
                            <th className="text-left py-2 px-3">규격</th>
                            <th className="text-right py-2 px-3">수량</th>
                            <th className="text-right py-2 px-3">단가</th>
                            <th className="text-left py-2 px-3">단위</th>
                            <th className="text-right py-2 px-3">총액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {excelData.slice(0, 5).map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 px-3">{item.itemName}</td>
                              <td className="py-2 px-3">{item.specification}</td>
                              <td className="text-right py-2 px-3">{item.quantity}</td>
                              <td className="text-right py-2 px-3">{item.unitPrice.toLocaleString()}</td>
                              <td className="py-2 px-3">{item.unit}</td>
                              <td className="text-right py-2 px-3">{item.totalPrice.toLocaleString()}</td>
                            </tr>
                          ))}
                          {excelData.length > 5 && (
                            <tr>
                              <td colSpan={6} className="py-2 px-3 text-center text-gray-500">
                                ... 외 {excelData.length - 5}개 품목
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
