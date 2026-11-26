# Stamp the published metadata on a rendered PDF: Title, Author, Subject,
# Creator, Producer and dates, and the document language (en-GB).
# Requires pypdf. Usage: python3 collateral/tools/stamp.py <in.pdf> <out.pdf> "<title>"
import sys
from datetime import datetime, timezone
from pypdf import PdfReader, PdfWriter

src, dst, title = sys.argv[1], sys.argv[2], sys.argv[3]
reader = PdfReader(src)
writer = PdfWriter(clone_from=reader)
stamp = datetime.now(timezone.utc).strftime("D:%Y%m%d%H%M%S+00'00'")
writer.metadata = None
writer.add_metadata({
    "/Title": title,
    "/Author": "Intervene Limited",
    "/Subject": "AGDA®, intervene.uk",
    "/Creator": "Intervene Limited",
    "/Producer": "Intervene Limited",
    "/CreationDate": stamp,
    "/ModDate": stamp,
})
from pypdf.generic import NameObject, TextStringObject
writer._root_object[NameObject("/Lang")] = TextStringObject("en-GB")
writer.compress_identical_objects()
with open(dst, "wb") as fh:
    writer.write(fh)
print(dst, len(reader.pages), "pages")
