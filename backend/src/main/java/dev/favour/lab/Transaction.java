package dev.favour.lab;

import java.math.BigDecimal;
import java.time.LocalDate;

public record Transaction(
    long id,
    String externalId,
    LocalDate bookedOn,
    String merchant,
    String category,
    BigDecimal amount,
    String currency) {}
