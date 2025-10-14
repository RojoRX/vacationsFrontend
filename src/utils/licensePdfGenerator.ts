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

  // === COLORES Y ESTILOS ===
  const primaryColor: [number, number, number] = [41, 128, 185]; // Azul institucional
  const secondaryColor: [number, number, number] = [25, 25, 25]; // Negro
  const lightGray: [number, number, number] = [240, 240, 240];

  // === ENCABEZADO ===
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('UNIVERSIDAD AUTÓNOMA "TOMÁS FRÍAS"', 105, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text('DIRECCIÓN ADMINISTRATIVA Y FINANCIERA', 105, 21, { align: 'center' });
  doc.text('DEPARTAMENTO DE PERSONAL', 105, 27, { align: 'center' });

  // === TÍTULO ===
  doc.setFillColor(...lightGray);
  doc.rect(0, 35, 210, 15, 'F');
  doc.setFontSize(18);
  doc.setTextColor(...secondaryColor);
  doc.text('AUTORIZACIÓN DE LICENCIA', 105, 45, { align: 'center' });

  // === INFORMACIÓN DE LA LICENCIA ===
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, 55, 180, 75, 3, 3, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);

  let y = 65;
  const labelX = 20;
  const valueX = 60;
  const rightLabelX = 110;
  const rightValueX = 150;

  // Fila 1
  doc.setFont('helvetica', 'bold');
  doc.text('N° Licencia:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(license.id?.toString() || '-', valueX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de salida:', rightLabelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateForPdf(license.startDate), rightValueX, y);
  y += 10;

  // Fila 2
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(license.licenseType || 'VACACIONES', valueX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de retorno:', rightLabelX, y);
  doc.setFont('helvetica', 'normal');
  const totalDaysNumber = isNaN(Number(license.totalDays)) ? 0 : Number(license.totalDays);
  const returnDate = calculateReturnDate(license.endDate, totalDaysNumber);
  doc.text(formatDateForPdf(returnDate), rightValueX, y);
  y += 10;

  // Fila 3
  doc.setFont('helvetica', 'bold');
  doc.text('Funcionario:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(options.user.fullName, valueX, y);
  y += 10;

  // Fila 4
  doc.setFont('helvetica', 'bold');
  doc.text('C.I.:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(options.user.ci, valueX, y);
  y += 10;



  // Fila 6
  doc.setFont('helvetica', 'bold');
  doc.text('Duración:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${license.totalDays} días`, valueX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Lapso solicitado:', rightLabelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(license.timeRequested || '-', rightValueX, y);
  y += 10;

  // Fila 7 - Medio día inicio y fin en columnas
  doc.setFont('helvetica', 'bold');
  doc.text('Inicio medio día:', labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(license.startHalfDay || 'Completo', valueX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Fin medio día:', rightLabelX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(license.endHalfDay || 'Completo', rightValueX, y);
  y += 10;

  // === FECHA DE EMISIÓN ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.text(`Potosí, ${formatFullDate(new Date())}`, 190, 140, { align: 'right' });

  // === FIRMAS ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FIRMAS DE AUTORIZACIÓN', 105, 160, { align: 'center' });

  const yFirma = 190;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(30, yFirma, 80, yFirma);   // SOLICITANTE
  doc.line(85, yFirma, 135, yFirma);  // JEFE INMEDIATO SUPERIOR
  doc.line(140, yFirma, 190, yFirma); // DEPTO. DE PERSONAL

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SOLICITANTE', 55, yFirma + 6, { align: 'center' });
  doc.text('JEFE INMEDIATO SUPERIOR', 110, yFirma + 6, { align: 'center' });
  doc.text('DEPTO. DE PERSONAL', 165, yFirma + 6, { align: 'center' });

  // === PIE DE PÁGINA ===
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento generado electrónicamente - UATF', 105, 285, { align: 'center' });

  return doc;
};

// === FUNCIONES AUXILIARES ===
const calculateReturnDate = (endDate: string, totalDays: number): Date => {
  const date = new Date(endDate);
  const days = typeof totalDays === 'string' ? parseFloat(totalDays) : totalDays;

  if (days < 1) return date;
  date.setDate(date.getDate() + 1);
  if (date.getDay() === 6) date.setDate(date.getDate() + 2);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date;
};

const formatFullDate = (date: Date): string => {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
};

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
