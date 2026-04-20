from xhtml2pdf import pisa
import os

html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Manual do Sistema</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; margin: 40px; }
        h1 { color: #1e3a8a; }
        p { font-size: 14px; line-height: 1.6; }
    </style>
</head>
<body>
    <h1>Manual do Sistema (Em Desenvolvimento)</h1>
    <p>Este documento é um placeholder para o Manual Completo do Utilizador.</p>
    <p>O administrador do sistema deverá substituir este ficheiro pelo PDF real do manual.</p>
    <p>Localização do ficheiro: <strong>frontend/public/docs/manual_sistema.pdf</strong></p>
</body>
</html>
"""

docs_dir = os.path.join('frontend', 'public', 'docs')
os.makedirs(docs_dir, exist_ok=True)
pdf_path = os.path.join(docs_dir, 'manual_sistema.pdf')

with open(pdf_path, "w+b") as result_file:
    pisa_status = pisa.CreatePDF(html_content, dest=result_file)

if pisa_status.err:
    print(f"Error creating PDF: {pisa_status.err}")
else:
    print(f"Successfully created PDF at {pdf_path}")
