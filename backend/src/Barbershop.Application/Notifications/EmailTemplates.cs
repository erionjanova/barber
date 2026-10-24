using System.Globalization;
using System.Net;

namespace Barbershop.Application.Notifications;

public record AppointmentEmailModel(
    string ClientName,
    string ClientPhone,
    string ServiceName,
    DateTimeOffset LocalStart,
    int DurationMinutes,
    decimal Price,
    string? Notes);

public record ShopEmailModel(string Name, string Address, string Phone, string Currency, string FrontendUrl);

public static class EmailTemplates
{
    private static readonly Dictionary<string, Dictionary<string, string>> Text = new()
    {
        ["sq"] = new()
        {
            ["confirm.subject"] = "Termini juaj u rezervua",
            ["confirm.title"] = "Termini u konfirmua",
            ["confirm.intro"] = "Përshëndetje {0}, termini juaj është rezervuar me sukses. Ju presim!",
            ["reminder.subject"] = "Kujtesë: termini juaj po afron",
            ["reminder.title"] = "Kujtesë për terminin",
            ["reminder.intro"] = "Përshëndetje {0}, ju kujtojmë që keni një termin së shpejti.",
            ["cancelled.subject"] = "Termini juaj u anulua",
            ["cancelled.title"] = "Termini u anulua",
            ["cancelled.intro"] = "Përshëndetje {0}, na vjen keq, por berberi duhej të anulonte terminin tuaj. Ju lutemi rezervoni një orar tjetër.",
            ["barber.new.subject"] = "Rezervim i ri: {0} – {1}",
            ["barber.new.title"] = "Rezervim i ri",
            ["barber.new.intro"] = "{0} sapo rezervoi një termin.",
            ["barber.cancel.subject"] = "Anulim: {0} – {1}",
            ["barber.cancel.title"] = "Termin i anuluar",
            ["barber.cancel.intro"] = "{0} anuloi terminin e tij/saj.",
            ["service"] = "Shërbimi",
            ["when"] = "Data dhe ora",
            ["duration"] = "Kohëzgjatja",
            ["minutes"] = "min",
            ["price"] = "Çmimi",
            ["name"] = "Emri",
            ["phone"] = "Telefoni",
            ["notes"] = "Shënime",
            ["button.mine"] = "Shiko terminet e mia",
            ["button.book"] = "Rezervo përsëri",
            ["button.admin"] = "Hap panelin",
            ["footer.cancel"] = "Nëse nuk mund të vini, ju lutemi anuloni terminin nga llogaria juaj."
        },
        ["en"] = new()
        {
            ["confirm.subject"] = "Your appointment is booked",
            ["confirm.title"] = "Appointment confirmed",
            ["confirm.intro"] = "Hi {0}, your appointment has been booked. See you soon!",
            ["reminder.subject"] = "Reminder: your appointment is coming up",
            ["reminder.title"] = "Appointment reminder",
            ["reminder.intro"] = "Hi {0}, just a reminder that you have an appointment coming up.",
            ["cancelled.subject"] = "Your appointment was cancelled",
            ["cancelled.title"] = "Appointment cancelled",
            ["cancelled.intro"] = "Hi {0}, we're sorry, but the barber had to cancel your appointment. Please pick another time.",
            ["barber.new.subject"] = "New booking: {0} – {1}",
            ["barber.new.title"] = "New booking",
            ["barber.new.intro"] = "{0} just booked an appointment.",
            ["barber.cancel.subject"] = "Cancelled: {0} – {1}",
            ["barber.cancel.title"] = "Appointment cancelled",
            ["barber.cancel.intro"] = "{0} cancelled their appointment.",
            ["service"] = "Service",
            ["when"] = "Date & time",
            ["duration"] = "Duration",
            ["minutes"] = "min",
            ["price"] = "Price",
            ["name"] = "Name",
            ["phone"] = "Phone",
            ["notes"] = "Notes",
            ["button.mine"] = "View my appointments",
            ["button.book"] = "Book again",
            ["button.admin"] = "Open dashboard",
            ["footer.cancel"] = "If you can't make it, please cancel from your account."
        }
    };

    public static (string Subject, string Html) BookingConfirmation(string lang, AppointmentEmailModel a, ShopEmailModel shop) =>
        Customer(lang, "confirm", a, shop, T(lang, "button.mine"), $"{shop.FrontendUrl}/appointments", showCancelHint: true);

    public static (string Subject, string Html) Reminder(string lang, AppointmentEmailModel a, ShopEmailModel shop) =>
        Customer(lang, "reminder", a, shop, T(lang, "button.mine"), $"{shop.FrontendUrl}/appointments", showCancelHint: true);

    public static (string Subject, string Html) CancelledByBarber(string lang, AppointmentEmailModel a, ShopEmailModel shop) =>
        Customer(lang, "cancelled", a, shop, T(lang, "button.book"), $"{shop.FrontendUrl}/book", showCancelHint: false);

    public static (string Subject, string Html) NewBookingForBarber(string lang, AppointmentEmailModel a, ShopEmailModel shop) =>
        Barber(lang, "barber.new", a, shop);

    public static (string Subject, string Html) CancellationForBarber(string lang, AppointmentEmailModel a, ShopEmailModel shop) =>
        Barber(lang, "barber.cancel", a, shop);

    private static (string, string) Customer(
        string lang, string key, AppointmentEmailModel a, ShopEmailModel shop, string buttonText, string buttonUrl, bool showCancelHint)
    {
        var rows = new List<(string, string)>
        {
            (T(lang, "service"), a.ServiceName),
            (T(lang, "when"), FormatDate(lang, a.LocalStart)),
            (T(lang, "duration"), $"{a.DurationMinutes} {T(lang, "minutes")}"),
            (T(lang, "price"), FormatPrice(a.Price, shop.Currency))
        };

        var html = Layout(
            shop,
            T(lang, $"{key}.title"),
            string.Format(T(lang, $"{key}.intro"), a.ClientName),
            rows,
            buttonText,
            buttonUrl,
            showCancelHint ? T(lang, "footer.cancel") : null);

        return (T(lang, $"{key}.subject"), html);
    }

    private static (string, string) Barber(string lang, string key, AppointmentEmailModel a, ShopEmailModel shop)
    {
        var rows = new List<(string, string)>
        {
            (T(lang, "name"), a.ClientName),
            (T(lang, "phone"), a.ClientPhone),
            (T(lang, "service"), a.ServiceName),
            (T(lang, "when"), FormatDate(lang, a.LocalStart)),
            (T(lang, "price"), FormatPrice(a.Price, shop.Currency))
        };
        if (!string.IsNullOrWhiteSpace(a.Notes))
            rows.Add((T(lang, "notes"), a.Notes));

        var shortDate = a.LocalStart.ToString("dd.MM HH:mm", CultureInfo.InvariantCulture);
        var subject = string.Format(T(lang, $"{key}.subject"), a.ClientName, shortDate);
        var html = Layout(
            shop,
            T(lang, $"{key}.title"),
            string.Format(T(lang, $"{key}.intro"), a.ClientName),
            rows,
            T(lang, "button.admin"),
            $"{shop.FrontendUrl}/admin",
            null);

        return (subject, html);
    }

    private static string T(string lang, string key) =>
        Text.TryGetValue(lang, out var dict) && dict.TryGetValue(key, out var value) ? value : Text["en"][key];

    private static string FormatDate(string lang, DateTimeOffset local)
    {
        var culture = CultureInfo.GetCultureInfo(lang == "en" ? "en-GB" : "sq-AL");
        return local.ToString("dddd, d MMMM yyyy · HH:mm", culture);
    }

    private static string FormatPrice(decimal price, string currency) =>
        $"{price.ToString("0.##", CultureInfo.InvariantCulture)} {currency}";

    private static string E(string value) => WebUtility.HtmlEncode(value);

    private static string Layout(
        ShopEmailModel shop, string title, string intro, IEnumerable<(string Label, string Value)> rows,
        string buttonText, string buttonUrl, string? footerNote)
    {
        var rowsHtml = string.Concat(rows.Select(r => $"""
            <tr>
              <td style="padding:10px 0;color:#71717a;font-size:14px;border-bottom:1px solid #f4f4f5;">{E(r.Label)}</td>
              <td style="padding:10px 0;color:#18181b;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f4f4f5;">{E(r.Value)}</td>
            </tr>
            """));

        var footerHtml = footerNote is null
            ? ""
            : $"""<p style="margin:24px 0 0;color:#71717a;font-size:13px;line-height:1.5;">{E(footerNote)}</p>""";

        var contact = string.Join(" · ", new[] { shop.Address, shop.Phone }.Where(s => !string.IsNullOrWhiteSpace(s)).Select(E));

        return $"""
            <!doctype html>
            <html>
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
                <tr><td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
                    <tr><td style="background:#18181b;padding:24px 32px;">
                      <span style="color:#d4a373;font-size:20px;font-weight:700;letter-spacing:0.5px;">{E(shop.Name)}</span>
                    </td></tr>
                    <tr><td style="padding:32px;">
                      <h1 style="margin:0 0 8px;color:#18181b;font-size:22px;">{E(title)}</h1>
                      <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.5;">{E(intro)}</p>
                      <table width="100%" cellpadding="0" cellspacing="0">{rowsHtml}</table>
                      <a href="{E(buttonUrl)}" style="display:inline-block;margin-top:28px;background:#d4a373;color:#18181b;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;">{E(buttonText)}</a>
                      {footerHtml}
                    </td></tr>
                    <tr><td style="padding:16px 32px;background:#fafafa;color:#a1a1aa;font-size:12px;">{contact}</td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }
}
