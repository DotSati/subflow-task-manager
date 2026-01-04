import jsPDF from 'jspdf';
import { Task } from '@/types/task';
import { format } from 'date-fns';
import RobotoFont from '@/assets/fonts/Roboto-Regular.ttf';

const loadFontAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const exportTaskToPdf = async (task: Task) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = 20;

  // Load and register Roboto font for Cyrillic support
  const fontBase64 = await loadFontAsBase64(RobotoFont);
  doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto');

  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 2;
  };

  const addLine = () => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  // Title
  addText(task.name, 18, true);
  yPosition += 3;

  // Status and dates
  const status = task.completeDate ? 'Completed' : 'In Progress';
  addText(`Status: ${status}`, 10, false, task.completeDate ? [34, 139, 34] : [100, 100, 100]);
  
  if (task.dueDate) {
    addText(`Due Date: ${format(task.dueDate, 'MMM d, yyyy')}`, 10);
  }
  
  if (task.completeDate) {
    addText(`Completed: ${format(task.completeDate, 'MMM d, yyyy')}`, 10);
  }

  yPosition += 3;
  addLine();

  // Description
  if (task.content) {
    addText('Description', 12, true);
    // Remove markdown image syntax and HTML comments for PDF
    const cleanContent = task.content
      .replace(/!\[.*?\]\(.*?\)/g, '[image]')
      .replace(/<!--.*?-->/gs, '');
    addText(cleanContent, 10);
    yPosition += 3;
    addLine();
  }

  // Get subtasks - need to check which ones belong to groups
  // The subtask type has the group relationship through subtaskGroups array on the task
  const subtaskIdsInGroups = new Set(
    (task.subtaskGroups || []).flatMap(g => g.subtasks.map(s => s.id))
  );
  
  const ungroupedSubtasks = task.subtasks.filter(s => !subtaskIdsInGroups.has(s.id));
  const sortedGroups = [...(task.subtaskGroups || [])].sort((a, b) => a.orderIndex - b.orderIndex);

  const hasSubtasks = ungroupedSubtasks.length > 0 || sortedGroups.length > 0;

  if (hasSubtasks) {
    addText('Subtasks', 14, true);
    yPosition += 3;

    // Ungrouped subtasks
    ungroupedSubtasks
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .forEach((subtask, index) => {
        const statusIcon = subtask.completeDate ? '✓' : subtask.skipped ? '⊘' : '○';
        const statusColor: [number, number, number] = subtask.completeDate 
          ? [34, 139, 34] 
          : subtask.skipped 
            ? [150, 150, 150] 
            : [0, 0, 0];
        
        addText(`${statusIcon} ${subtask.name}`, 11, false, statusColor);
        
        if (subtask.content) {
          const cleanContent = subtask.content
            .replace(/!\[.*?\]\(.*?\)/g, '[image]')
            .replace(/<!--.*?-->/gs, '')
            .trim();
          if (cleanContent) {
            addText(`   ${cleanContent}`, 9, false, [100, 100, 100]);
          }
        }
      });

    // Grouped subtasks
    sortedGroups.forEach(group => {
      yPosition += 3;
      addText(`▸ ${group.name}`, 12, true, [50, 50, 50]);
      
      const groupSubtasks = group.subtasks
        .sort((a, b) => a.orderIndex - b.orderIndex);

      groupSubtasks.forEach(subtask => {
        const statusIcon = subtask.completeDate ? '✓' : subtask.skipped ? '⊘' : '○';
        const statusColor: [number, number, number] = subtask.completeDate 
          ? [34, 139, 34] 
          : subtask.skipped 
            ? [150, 150, 150] 
            : [0, 0, 0];
        
        addText(`   ${statusIcon} ${subtask.name}`, 11, false, statusColor);
        
        if (subtask.content) {
          const cleanContent = subtask.content
            .replace(/!\[.*?\]\(.*?\)/g, '[image]')
            .replace(/<!--.*?-->/gs, '')
            .trim();
          if (cleanContent) {
            addText(`      ${cleanContent}`, 9, false, [100, 100, 100]);
          }
        }
      });
    });
  }

  // Footer
  yPosition = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Exported on ${format(new Date(), 'MMM d, yyyy HH:mm')}`, margin, yPosition);

  // Save
  const fileName = `${task.name.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};
