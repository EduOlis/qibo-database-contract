\# QiBo Knowledge Base



Este repositório contém o contrato do banco de dados Supabase

utilizado pelos projetos QiBo.



\## Fonte da Verdade



O arquivo abaixo representa o schema real do banco de dados:



\- `src/types/database.types.ts`



Ele é gerado automaticamente via Supabase CLI e deve ser atualizado

sempre que houver alterações estruturais no banco.



\## Domínios



\- `kb\_\*` → ingestão, validação, auditoria e versionamento do conhecimento

\- `tcm\_\*` → base clínica validada de MTC / Acupuntura



\## Contratos Formais



O diretório `/contracts` contém os contratos imutáveis que definem o comportamento do sistema:



\- **P0.md** → Contrato do Processo de Ingestão e Chunking Determinístico (v1.2.0)

\- **A0.md** → Contrato do Agente de Validação Humana

\- **p0\_execution\_profiles\_v1.md** → Perfis de execução concretos do P0 (PDF, Kindle, Web/HTML)



\### Perfis de Execução P0



Os perfis definem instâncias auditáveis e versionadas do P0:



1\. **p0-pdf-text-v1** → PDFs com texto digital embutido (pdftotext/Poppler 23.x)

2\. **p0-kindle-text-v1** → Arquivos Kindle sem DRM (Calibre 7.x)

3\. **p0-web-html-static-v1** → HTML estático via HTTP (curl 8.x + BeautifulSoup)



Cada perfil registra:

\- Ferramentas exatas e versões

\- Procedimentos determinísticos

\- Garantias e não-garantias

\- Riscos conhecidos



\### Conformidade de Schema



O arquivo `SCHEMA\_ADJUSTMENT\_PROPOSAL.md` documenta ajustes necessários em `kb\_ingestion\_logs` para conformidade total com P0 v1.2.0.



**Campos propostos:**

\- `execution\_profile` → identifica o perfil P0 usado

\- `operation\_type` → tipo de operação

\- `status` → resultado da execução

\- `execution\_time\_ms` → métrica de performance



