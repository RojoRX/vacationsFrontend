import axios, { AxiosError } from 'axios';

const downloadReport = async (params: {
  year?: number;
  month?: number;
  employeeType: string;
}): Promise<void> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.month) queryParams.append('month', params.month.toString());
    queryParams.append('employeeType', params.employeeType);

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/monthly?${queryParams.toString()}`;
    
    const response = await axios.get(url, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `reporte_${params.year || 'all'}`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch?.[1]) {
        fileName = fileNameMatch[1];
      }
    } else {
      fileName += `.xlsx`;
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);

  } catch (error: unknown) {
    // Manejo seguro de errores
    if (axios.isAxiosError(error)) {
      const serverMessage = error.response?.data?.message;
      const errorMessage = serverMessage || error.message || 'Error al descargar el reporte';
      console.error('Error en la solicitud:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(errorMessage);
    }

    if (error instanceof Error) {
      console.error('Error inesperado:', error.message);
      throw error;
    }

    console.error('Error completamente desconocido:', error);
    throw new Error('Ocurrió un error desconocido');
  }
};

export default {
  downloadReport
};