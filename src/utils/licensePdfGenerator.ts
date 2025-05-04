import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { License } from '../interfaces/licenseTypes';
import { User } from 'src/interfaces/usertypes';

interface PdfUserInfo {
  fullName: string;
  ci: string;
  position?: string;
}

interface PdfOptions {
  title?: string;
  user: PdfUserInfo;
}

export const generateLicensePdf = (license: License, options: PdfOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configuración de estilos
  const primaryColor: [number, number, number] = [41, 128, 185]; // Azul institucional
  const secondaryColor: [number, number, number] = [25, 25, 25]; // Negro
  const lightGray: [number, number, number] = [240, 240, 240];

  // --- ENCABEZADO INSTITUCIONAL ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('UNIVERSIDAD AUTÓNOMA "TOMÁS FRÍAS"', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('DIRECCIÓN ADMINISTRATIVA Y FINANCIERA', 105, 22, { align: 'center' });
  doc.text('DEPARTAMENTO DE PERSONAL', 105, 27, { align: 'center' });

  // --- TÍTULO DEL DOCUMENTO ---
  doc.setFillColor(...lightGray);
  doc.rect(0, 35, 210, 15, 'F');
  
  doc.setFontSize(18);
  doc.setTextColor(...secondaryColor);
  doc.text('AUTORIZACIÓN DE LICENCIA', 105, 45, { align: 'center' });

  // --- INFORMACIÓN DE LA LICENCIA ---
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  
  // Marco para la información
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 55, 180, 70, 3, 3, 'S');
  
  // Contenido de la licencia
  doc.setFont('helvetica', 'bold');
  doc.text('N° Licencia:', 20, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(license.id.toString(), 50, 65);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo:', 20, 75);
  doc.setFont('helvetica', 'normal');
  doc.text('VACACIONES', 50, 75);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Funcionario:', 20, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(options.user.fullName, 50, 85);
  
  doc.setFont('helvetica', 'bold');
  doc.text('C.I.:', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(options.user.ci, 50, 95);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Duración:', 20, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(`${license.totalDays} días`, 50, 105);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Salida:', 100, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateForPdf(license.startDate), 140, 65);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Retorno:', 100, 75);
  doc.setFont('helvetica', 'normal');
  const totalDaysNumber = isNaN(Number(license.totalDays)) ? 0 : Number(license.totalDays);
  const returnDate = calculateReturnDate(license.endDate, totalDaysNumber);
  
  doc.text(formatDateForPdf(returnDate), 140, 75);

// --- FECHA DE EMISIÓN ---
doc.setFontSize(11);
doc.setFont('helvetica', 'italic');
doc.text(`Potosí, ${formatFullDate(new Date())}`, 160, 130);

// --- SECCIÓN DE FIRMAS --- 
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.text('FIRMAS DE AUTORIZACIÓN', 105, 150, { align: 'center' });

// Coordenada base para firmas
const yFirma = 180;

// Dibujar líneas de firma
doc.setFont('helvetica', 'normal');
doc.line(30, yFirma, 80, yFirma);   // SOLICITANTE
doc.line(85, yFirma, 135, yFirma);  // JEFE INMEDIATO SUPERIOR
doc.line(140, yFirma, 190, yFirma); // DEPTO. DE PERSONAL

// Títulos de cargos centrados debajo de las líneas
doc.setFontSize(10);
doc.text('SOLICITANTE', 55, yFirma + 6, { align: 'center' });
doc.text('JEFE INMEDIATO SUPERIOR', 110, yFirma + 6, { align: 'center' });
doc.text('DEPTO. DE PERSONAL', 165, yFirma + 6, { align: 'center' });

// --- PIE DE PÁGINA ---
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);
doc.text('Documento generado electrónicamente - UATF', 105, 285, { align: 'center' });

return doc;
};

// Función para calcular fecha de retorno
const calculateReturnDate = (endDate: string, totalDays: number): Date => {
  const date = new Date(endDate);
  const days = typeof totalDays === 'string' ? parseFloat(totalDays) : totalDays;
  
  if (days < 1) return date;
  
  date.setDate(date.getDate() + 1);
  if (date.getDay() === 6) date.setDate(date.getDate() + 2);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  
  return date;
};

// Formatear fecha completa (ej: "5 de abril de 2023")
const formatFullDate = (date: Date): string => {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
};

// Formatear fecha corta (dd/mm/yyyy)
const formatDateForPdf = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error('Error formateando fecha:', date, e);
    return 'Fecha inválida';
  }
};
