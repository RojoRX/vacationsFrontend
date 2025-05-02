// utils/pdfGenerator.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para formatear fechas en español
const formatDate = (dateString) => {
  try {
    return format(parseISO(dateString), 'PPPP', { locale: es });
  } catch {
    // Fallback si hay error en el parseo
    return dateString.split('T')[0];
  }
};

// Función para formatear el rango de gestión (solo años)
const formatGestionRange = (startDate, endDate) => {
  try {
    const startYear = format(parseISO(startDate), 'yyyy');
    const endYear = format(parseISO(endDate), 'yyyy');
    return `${startYear}-${endYear}`;
  } catch {
    return `${startDate.split('-')[0]}-${endDate.split('-')[0]}`;
  }
};

export const generateVacationAuthorizationPDF = (request) => {
  if (!request) return;

  const doc = new jsPDF();
  const margin = 20;

  // Configuración inicial
  doc.setProperties({
    title: `Autorización de Vacaciones - ${request.userName}`,
    subject: 'Autorización de vacaciones',
    author: 'Departamento de Personal',
  });

  // Encabezado
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('AUTORIZACIÓN PARA EL USO DE VACACIONES', 105, margin, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 10, 210 - margin, margin + 10);

  // Subtítulo
  doc.setFontSize(12);
  doc.setFont('times', 'italic');
  doc.text('Por decreto No. ________', margin, margin + 20);

  // Contenido principal con fechas formateadas
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  
  const formattedContent = [
    `El Sr(a) ${request.userName}, está autorizado para hacer uso de sus vacaciones por el lapso de ${request.totalDays} días,`, `correspondiente a las gestiones ${formatGestionRange(request.managementPeriodStart, request.managementPeriodEnd)}.`,
    `Las vacaciones se tomarán a partir del ${formatDate(request.startDate)} hasta el ${formatDate(request.endDate)}.`,
    `El empleado deberá reincorporarse a sus funciones en fecha ${formatDate(request.returnDate)}.`
  ];

  // Agregar texto con saltos de línea controlados
  let yPosition = margin + 35;
  formattedContent.forEach(line => {
    doc.text(line, margin, yPosition, { maxWidth: 170 });
    yPosition += 10; // Espaciado entre líneas
  });

  // Tabla con datos formateados
  doc.autoTable({
    startY: yPosition + 10,
    theme: 'grid',
    head: [['Nombre', 'Días Totales', 'Fecha Inicio', 'Fecha Fin', 'Reincorporación']],
    body: [
      [
        request.userName,
        request.totalDays.toString(),
        formatDate(request.startDate),
        formatDate(request.endDate),
        formatDate(request.returnDate),
      ],
    ],
    styles: {
      font: 'times',
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [22, 71, 110], // Color azul oscuro para el encabezado
      textColor: 255, // Texto blanco
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Nombre
      1: { cellWidth: 25 }, // Días
      2: { cellWidth: 35 }, // Inicio
      3: { cellWidth: 35 }, // Fin
      4: { cellWidth: 35 }  // Reincorporación
    }
  });

  // Firma y sello
  const signatureY = doc.previousAutoTable.finalY + 25;
  doc.setFont('times', 'normal');
  
  // Firma Jefe de Personal
  doc.text('____________________________', margin, signatureY);
  doc.text('Firma del Jefe de Personal', margin, signatureY + 7);
  doc.text('Sello Institucional', margin, signatureY + 14);
  
  // Firma Solicitante
  doc.text('____________________________', 120, signatureY);
  doc.text('Firma del Solicitante', 120, signatureY + 7);
  doc.text(`C.I. ${request.ci}`, 120, signatureY + 14);

  // Footer institucional
  doc.setFontSize(10);
  doc.text('Universidad Autónoma Tomás Frías - Departamento de Personal', 105, 285, { align: 'center' });
  doc.text(`Documento generado el ${formatDate(new Date().toISOString())}`, 105, 290, { align: 'center' });

  // Guardar el PDF con nombre personalizado
  const fileName = `Autorizacion_Vacaciones_${request.userName.replace(/\s+/g, '_')}_${formatDate(request.startDate).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};