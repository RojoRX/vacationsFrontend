// utils/pdfGenerator.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Para tablas y bordes más estilizados.

export const generateVacationAuthorizationPDF = (request) => {
  if (!request) return;

  const doc = new jsPDF();

  // Margen inicial
  const margin = 20;

  // Estilo y título
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

  // Contenido principal
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  const content = `
El Sr(a) ${request.userName}, está autorizado para hacer uso de sus vacaciones por el lapso de ${request.totalDays} días, correspondiente a las gestiones ${request.managementPeriodStart} - ${request.managementPeriodEnd}.
Las vacaciones se tomarán a partir del ${request.startDate} hasta el ${request.endDate}.
El empleado deberá reincorporarse a sus funciones en fecha ${request.returnDate}.
  `;
  doc.text(content, margin, margin + 35, { maxWidth: 170, lineHeightFactor: 1.5 });

  // Tabla con datos (opcional, para más estructura)
  doc.autoTable({
    startY: margin + 70,
    theme: 'grid',
    head: [['Nombre', 'Días Totales', 'Fecha Inicio', 'Fecha Fin', 'Reincorporación']],
    body: [
      [
        request.userName,
        request.totalDays,
        request.startDate,
        request.endDate,
        request.returnDate,
      ],
    ],
    styles: {
      font: 'times',
      fontSize: 10,
    },
  });

  // Pie de firma
  const signatureY = doc.previousAutoTable.finalY + 20 || 150;
  doc.setFont('times', 'normal');
  doc.text('____________________________', margin, signatureY);
  doc.text('Firma del Jefe de Personal', margin, signatureY + 10);

  doc.text('____________________________', 120, signatureY);
  doc.text('Firma del Solicitante', 120, signatureY + 10);

  // Footer (número de página)
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(10);
  doc.text(`Página ${pageCount}`, 105, 290, { align: 'center' });

  // Guardar el PDF
  doc.save('autorizacion-vacaciones.pdf');
};
