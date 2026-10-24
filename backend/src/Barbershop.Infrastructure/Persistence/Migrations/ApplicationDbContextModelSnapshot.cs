using System;
using Barbershop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Barbershop.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    partial class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "10.0.13")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.HasPostgresExtension(modelBuilder, "btree_gist");
            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("Barbershop.Domain.Entities.Appointment", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid")
                        .HasColumnName("id");

                    b.Property<DateTimeOffset?>("CancelledAt")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("cancelled_at");

                    b.Property<string>("ClientName")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("client_name");

                    b.Property<string>("ClientPhone")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)")
                        .HasColumnName("client_phone");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("created_at");

                    b.Property<Guid>("CustomerId")
                        .HasColumnType("uuid")
                        .HasColumnName("customer_id");

                    b.Property<DateTimeOffset>("EndTime")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("end_time");

                    b.Property<string>("Notes")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)")
                        .HasColumnName("notes");

                    b.Property<decimal>("Price")
                        .HasPrecision(10, 2)
                        .HasColumnType("numeric(10,2)")
                        .HasColumnName("price");

                    b.Property<DateTimeOffset?>("ReminderSentAt")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("reminder_sent_at");

                    b.Property<Guid>("ServiceId")
                        .HasColumnType("uuid")
                        .HasColumnName("service_id");

                    b.Property<DateTimeOffset>("StartTime")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("start_time");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)")
                        .HasColumnName("status");

                    b.HasKey("Id")
                        .HasName("pk_appointments");

                    b.HasIndex("CustomerId")
                        .HasDatabaseName("ix_appointments_customer_id");

                    b.HasIndex("ServiceId")
                        .HasDatabaseName("ix_appointments_service_id");

                    b.HasIndex("StartTime")
                        .HasDatabaseName("ix_appointments_start_time");

                    b.HasIndex("Status", "ReminderSentAt")
                        .HasDatabaseName("ix_appointments_status_reminder_sent_at");

                    b.ToTable("appointments", null, t =>
                        {
                            t.HasCheckConstraint("ck_appointments_end_after_start", "end_time > start_time");
                        });
                });

            modelBuilder.Entity("Barbershop.Domain.Entities.Service", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid")
                        .HasColumnName("id");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("created_at");

                    b.Property<string>("DescriptionEn")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)")
                        .HasColumnName("description_en");

                    b.Property<string>("DescriptionSq")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)")
                        .HasColumnName("description_sq");

                    b.Property<int>("DurationMinutes")
                        .HasColumnType("integer")
                        .HasColumnName("duration_minutes");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean")
                        .HasColumnName("is_active");

                    b.Property<string>("NameEn")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("name_en");

                    b.Property<string>("NameSq")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("name_sq");

                    b.Property<decimal>("Price")
                        .HasPrecision(10, 2)
                        .HasColumnType("numeric(10,2)")
                        .HasColumnName("price");

                    b.Property<int>("SortOrder")
                        .HasColumnType("integer")
                        .HasColumnName("sort_order");

                    b.HasKey("Id")
                        .HasName("pk_services");

                    b.ToTable("services", (string)null);
                });

            modelBuilder.Entity("Barbershop.Domain.Entities.TimeOff", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid")
                        .HasColumnName("id");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("created_at");

                    b.Property<DateOnly>("Date")
                        .HasColumnType("date")
                        .HasColumnName("date");

                    b.Property<string>("Reason")
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)")
                        .HasColumnName("reason");

                    b.HasKey("Id")
                        .HasName("pk_time_offs");

                    b.HasIndex("Date")
                        .IsUnique()
                        .HasDatabaseName("ix_time_offs_date");

                    b.ToTable("time_offs", (string)null);
                });

            modelBuilder.Entity("Barbershop.Domain.Entities.User", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid")
                        .HasColumnName("id");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("created_at");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)")
                        .HasColumnName("email");

                    b.Property<string>("FullName")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)")
                        .HasColumnName("full_name");

                    b.Property<string>("PasswordHash")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("password_hash");

                    b.Property<string>("PhoneNumber")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)")
                        .HasColumnName("phone_number");

                    b.Property<string>("PreferredLanguage")
                        .IsRequired()
                        .HasMaxLength(5)
                        .HasColumnType("character varying(5)")
                        .HasColumnName("preferred_language");

                    b.Property<string>("Role")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)")
                        .HasColumnName("role");

                    b.HasKey("Id")
                        .HasName("pk_users");

                    b.HasIndex("Email")
                        .IsUnique()
                        .HasDatabaseName("ix_users_email");

                    b.ToTable("users", (string)null);
                });

            modelBuilder.Entity("Barbershop.Domain.Entities.WorkingHours", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid")
                        .HasColumnName("id");

                    b.Property<TimeOnly>("CloseTime")
                        .HasColumnType("time without time zone")
                        .HasColumnName("close_time");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone")
                        .HasColumnName("created_at");

                    b.Property<int>("DayOfWeek")
                        .HasColumnType("integer")
                        .HasColumnName("day_of_week");

                    b.Property<bool>("IsOpen")
                        .HasColumnType("boolean")
                        .HasColumnName("is_open");

                    b.Property<TimeOnly>("OpenTime")
                        .HasColumnType("time without time zone")
                        .HasColumnName("open_time");

                    b.HasKey("Id")
                        .HasName("pk_working_hours");

                    b.HasIndex("DayOfWeek")
                        .IsUnique()
                        .HasDatabaseName("ix_working_hours_day_of_week");

                    b.ToTable("working_hours", (string)null);
                });

            modelBuilder.Entity("Barbershop.Domain.Entities.Appointment", b =>
                {
                    b.HasOne("Barbershop.Domain.Entities.User", "Customer")
                        .WithMany("Appointments")
                        .HasForeignKey("CustomerId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("fk_appointments_users_customer_id");

                    b.HasOne("Barbershop.Domain.Entities.Service", "Service")
                        .WithMany()
                        .HasForeignKey("ServiceId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("fk_appointments_services_service_id");

                    b.Navigation("Customer");

                    b.Navigation("Service");
                });

            modelBuilder.Entity("Barbershop.Domain.Entities.User", b =>
                {
                    b.Navigation("Appointments");
                });
#pragma warning restore 612, 618
        }
    }
}
