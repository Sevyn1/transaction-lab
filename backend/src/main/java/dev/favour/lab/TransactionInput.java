package dev.favour.lab;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionInput(
    @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{1,64}") String externalId,
    @NotNull @PastOrPresent LocalDate bookedOn,
    @NotBlank @Size(max = 100) String merchant,
    @NotBlank @Pattern(regexp = "FOOD|TRANSPORT|HOUSING|SHOPPING|OTHER") String category,
    @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
    @NotBlank @Pattern(regexp = "CAD") String currency) {}
