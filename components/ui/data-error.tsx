type DataErrorProps = {
  title?: string;
  description?: string;
};

export function DataError({
  title = "تعذر تحميل البيانات",
  description = "حدث خطأ مؤقت أثناء تحميل البيانات. حاول تحديث الصفحة بعد قليل.",
}: DataErrorProps) {
  return (
    <section className="rounded-lg border border-red-100 bg-red-50 p-4 text-red-800 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{description}</p>
    </section>
  );
}
