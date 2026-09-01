import os
import subprocess
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, Flowable
)
from reportlab.pdfgen import canvas

# 1. DETECÇÃO DINÂMICA DO REPOSITÓRIO E CAMINHO DO PDF
repo_dir = os.path.dirname(os.path.abspath(__file__))
repo_basename = os.path.basename(repo_dir)
formatted_repo_name = repo_basename.replace('-', ' ').replace('_', ' ').title()
pdf_filename = f"Guia_de_Estudos_{repo_basename.replace('-', '_')}.pdf"
pdf_path = os.path.join(repo_dir, pdf_filename)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Ignora cabeçalho e rodapé na capa
        self.saveState()
        self.setFont('Helvetica', 8)
        self.setFillColor(colors.HexColor('#6B7280'))
        
        # Cabeçalho
        header_text = f'Guia de Estudos — {formatted_repo_name} (Índice de Commits & Código)'
        self.drawString(54, 805, header_text[:90])
        self.setStrokeColor(colors.HexColor('#E5E7EB'))
        self.setLineWidth(0.5)
        self.line(54, 797, 541, 797)
        
        # Rodapé
        page_text = f'Página {self._pageNumber} de {page_count}'
        self.drawRightString(541, 32, page_text)
        footer_text = f'Luis Fernando Brandão | {repo_basename}'
        self.drawString(54, 32, footer_text)
        self.line(54, 44, 541, 44)
        
        self.restoreState()

class Bookmark(Flowable):
    def __init__(self, key, title, level=0):
        super().__init__()
        self.key = key
        self.title = title
        self.level = level

    def wrap(self, availWidth, availHeight):
        return 0, 0

    def draw(self):
        self.canv.bookmarkPage(self.key)
        self.canv.addOutlineEntry(self.title, self.key, level=self.level, closed=(self.level > 0))

def get_git_commits():
    cmd = ['git', 'log', '--reverse', '--format=%H|%h|%s|%an|%ad', '--date=format:%Y-%m-%d %H:%M']
    res = subprocess.run(cmd, cwd=repo_dir, capture_output=True, text=True, errors='replace', check=True)
    commits = []
    for line in res.stdout.strip().split('\n'):
        if not line:
            continue
        parts = line.split('|')
        if len(parts) >= 5:
            commits.append({
                'full_hash': parts[0],
                'hash': parts[1],
                'subject': parts[2],
                'author': parts[3],
                'date': parts[4]
            })
    return commits

def get_commit_details(commit):
    full_hash = commit['full_hash']
    
    # Obter arquivos modificados no commit
    res_files = subprocess.run(
        ['git', 'show', '--name-only', '--format=', full_hash],
        cwd=repo_dir, capture_output=True, text=True, errors='replace'
    )
    files = [f.strip() for f in res_files.stdout.strip().split('\n') if f.strip()]
    commit['files'] = files

    # Obter linhas adicionadas no diff (ignora arquivos binários)
    res_diff = subprocess.run(
        ['git', 'show', full_hash],
        cwd=repo_dir, capture_output=True, text=True, errors='replace'
    )
    added_lines = []
    in_diff = False
    skip_file = False
    
    binary_extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.zip', '.ico', '.svg', '.mp4', '.sqlite', '.db', '.woff', '.ttf', '.eot']
    
    for line in res_diff.stdout.split('\n'):
        if line.startswith('diff --git'):
            in_diff = True
            skip_file = any(line.lower().endswith(ext) for ext in binary_extensions)
            continue
        if in_diff and not skip_file:
            if line.startswith('+++ ') or line.startswith('--- ') or line.startswith('index '):
                continue
            if line.startswith('+') and not line.startswith('+++'):
                added_lines.append(line[1:])
    
    code = '\n'.join(added_lines).strip()
    commit['code'] = code
    return commit

def format_section_title(folder_name):
    match = re.match(r'^(\d+)[-_](.*)$', folder_name)
    if match:
        num, name = match.groups()
        formatted_name = name.replace('-', ' ').replace('_', ' ').title()
        return f"Seção {num}: {formatted_name}"
    else:
        formatted_name = folder_name.replace('-', ' ').replace('_', ' ').title()
        return f"Diretório: {formatted_name} ({folder_name})"

def categorize_commits(commits):
    sections = {}
    for c in commits:
        sec_key = 'Geral / Raiz do Projeto'
        for f in c['files']:
            parts = f.split('/')
            if len(parts) > 1:
                sec_key = parts[0]
                break
        
        if sec_key == 'Geral / Raiz do Projeto':
            sec_title = sec_key
        else:
            sec_title = format_section_title(sec_key)

        c['section_key'] = sec_key
        c['section_title'] = sec_title
        sections.setdefault(sec_title, []).append(c)

    return sections

print(f"🚀 Repositório identificado: {repo_basename}")
print('Coletando commits do Git...')
raw_commits = get_git_commits()
print(f'Total de {len(raw_commits)} commits encontrados.')

for idx, c in enumerate(raw_commits, 1):
    get_commit_details(c)

grouped_sections = categorize_commits(raw_commits)

# CONFIGURAÇÃO DE ESTILOS DO REPORTLAB
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'CoverTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=22,
    leading=28,
    textColor=colors.HexColor('#0F172A'),
    alignment=1,
    spaceAfter=12
)

subtitle_style = ParagraphStyle(
    'CoverSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=12,
    leading=16,
    textColor=colors.HexColor('#475569'),
    alignment=1,
    spaceAfter=24
)

h1_style = ParagraphStyle(
    'SectionHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=18,
    textColor=colors.HexColor('#1E3A8A'),
    spaceBefore=16,
    spaceAfter=8,
    keepWithNext=True
)

h2_style = ParagraphStyle(
    'CommitHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=10.5,
    leading=13.5,
    textColor=colors.HexColor('#2563EB'),
    spaceBefore=10,
    spaceAfter=3,
    keepWithNext=True
)

meta_style = ParagraphStyle(
    'CommitMeta',
    parent=styles['Normal'],
    fontName='Helvetica-Oblique',
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor('#64748B'),
    spaceAfter=4
)

body_style = ParagraphStyle(
    'Body_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=12.5,
    textColor=colors.HexColor('#334155'),
    spaceAfter=4
)

code_style = ParagraphStyle(
    'Code_Custom',
    parent=styles['Normal'],
    fontName='Courier',
    fontSize=7.5,
    leading=9.5,
    textColor=colors.HexColor('#0F172A'),
    spaceBefore=2,
    spaceAfter=2
)

def make_code_box(code_text):
    if not code_text.strip():
        code_text = '// (Nenhuma alteração de código ou apenas arquivos binários/deletados)'
    
    # Limita o número de linhas por bloco para 35 para evitar estouro de página
    lines = code_text.split('\n')
    if len(lines) > 35:
        truncated_count = len(lines) - 35
        lines = lines[:35] + [f'// ... [{truncated_count} linhas omitidas para manter a legibilidade do PDF] ...']
        code_text = '\n'.join(lines)

    escaped = code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>').replace(' ', '&nbsp;')
    p = Paragraph(escaped, code_style)
    t = Table([[p]], colWidths=[487])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BORDER', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

story = []

# CAPA DO PDF
story.append(Spacer(1, 40))
story.append(Paragraph(f'⚡ Guia de Estudos — {formatted_repo_name}', title_style))
story.append(Paragraph('Manual de Referência Indexado por Commits do Git', subtitle_style))
story.append(HRFlowable(width='60%', thickness=2, color=colors.HexColor('#2563EB'), spaceAfter=30))

meta_cover = f'''
<b>Autor:</b> Luis Fernando Brandão<br/>
<b>Repositório:</b> <code>{repo_basename}</code><br/>
<b>Total de Commits Indexados:</b> {len(raw_commits)} commits<br/>
<b>Total de Seções / Diretórios:</b> {len(grouped_sections)}<br/>
<b>Descrição:</b> Guia gerado automaticamente a partir dos commits do repositório, contendo código adicionado, arquivos alterados e histórico do Git.
'''
story.append(Paragraph(meta_cover, ParagraphStyle('MetaCover', parent=body_style, alignment=1, fontSize=9.5, leading=15)))
story.append(Spacer(1, 25))

# TABELA RESUMO DAS SEÇÕES
story.append(Paragraph('<b>Resumo das Seções Indexadas:</b>', ParagraphStyle('SumTitle', parent=body_style, fontName='Helvetica-Bold', fontSize=11, spaceAfter=8)))
table_data = [['Seção / Diretório', 'Qtd Commits']]
for sec_title, comms in grouped_sections.items():
    table_data.append([sec_title, str(len(comms))])

t_summary = Table(table_data, colWidths=[380, 107])
t_summary.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 9),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
]))
story.append(t_summary)
story.append(PageBreak())

# CONTEÚDO DAS SEÇÕES E COMMITS
sec_counter = 1
for sec_title, comms in grouped_sections.items():
    sec_key = f'sec_{sec_counter}'
    sec_counter += 1

    story.append(Bookmark(sec_key, sec_title, level=0))
    story.append(Paragraph(sec_title, h1_style))
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))

    for c in comms:
        commit_key = f"c_{c['hash']}"
        commit_label = f"[{c['hash']}] {c['subject']}"
        
        # Adiciona marcadores de índice no PDF para cada commit
        story.append(Bookmark(commit_key, commit_label, level=1))
        
        # Cabeçalho e Metadados do Commit
        story.append(Paragraph(f"📌 {c['subject']}", h2_style))
        files_str = ', '.join(c['files']) if c['files'] else 'Nenhum'
        meta_str = f"<b>Commit:</b> <code>{c['hash']}</code> | <b>Data:</b> {c['date']} | <b>Arquivos:</b> <code>{files_str}</code>"
        story.append(Paragraph(meta_str, meta_style))
        
        # Bloco de Código
        story.append(make_code_box(c['code']))
        story.append(Spacer(1, 8))

    story.append(Spacer(1, 12))

print('Gerando arquivo PDF...')
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    leftMargin=54,
    rightMargin=54,
    topMargin=54,
    bottomMargin=54
)

doc.build(story, canvasmaker=NumberedCanvas)
print('✨ PDF gerado com sucesso em:', pdf_path)
