using System.Threading.Channels;
using Barbershop.Application.Common.Interfaces;

namespace Barbershop.Infrastructure.Email;

public class EmailQueue
{
    private readonly Channel<EmailMessage> _channel = Channel.CreateBounded<EmailMessage>(
        new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.Wait });

    public ChannelReader<EmailMessage> Reader => _channel.Reader;
    public ChannelWriter<EmailMessage> Writer => _channel.Writer;
}

public class QueuedEmailSender(EmailQueue queue) : IEmailSender
{
    public ValueTask QueueAsync(EmailMessage message, CancellationToken cancellationToken = default) =>
        queue.Writer.WriteAsync(message, cancellationToken);
}
