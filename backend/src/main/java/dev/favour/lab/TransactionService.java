package dev.favour.lab;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

@Service
public class TransactionService {
  private final JdbcTemplate db;

  public TransactionService(JdbcTemplate db) {
    this.db = db;
  }

  private static final Set<String> CATEGORIES =
      Set.of("FOOD", "TRANSPORT", "HOUSING", "SHOPPING", "OTHER");
  private static final RowMapper<Transaction> ROW =
      (r, n) ->
          new Transaction(
              r.getLong("id"),
              r.getString("external_id"),
              r.getDate("booked_on").toLocalDate(),
              r.getString("merchant"),
              r.getString("category"),
              r.getBigDecimal("amount"),
              r.getString("currency"));

  public record Page(List<Transaction> items, long total, int page, int size) {}

  public record Summary(
      long count, BigDecimal total, String currency, Map<String, BigDecimal> byCategory) {}

  public Page list(String category, int page, int size) {
    validateCategory(category);
    if (page < 0 || page > 100000 || size < 1 || size > 100)
      throw new IllegalArgumentException("page must be 0–100000 and size 1–100");
    String where = category == null ? "" : " WHERE category=?";
    List<Object> args = new ArrayList<>();
    if (category != null) args.add(category);
    Long count =
        db.queryForObject("SELECT COUNT(*) FROM transactions" + where, Long.class, args.toArray());
    args.add(size);
    args.add((long) page * size);
    var rows =
        db.query(
            "SELECT * FROM transactions"
                + where
                + " ORDER BY booked_on DESC,id DESC LIMIT ? OFFSET ?",
            ROW,
            args.toArray());
    return new Page(rows, count == null ? 0 : count, page, size);
  }

  public Transaction create(TransactionInput t) {
    db.update(
        "INSERT INTO transactions(external_id,booked_on,merchant,category,amount,currency)"
            + " VALUES(?,?,?,?,?,?)",
        t.externalId(),
        t.bookedOn(),
        t.merchant().trim(),
        t.category(),
        t.amount(),
        t.currency());
    return db.queryForObject("SELECT * FROM transactions WHERE external_id=?", ROW, t.externalId());
  }

  public Summary summary(String category) {
    validateCategory(category);
    String where = category == null ? "" : " WHERE category=?";
    Object[] args = category == null ? new Object[] {} : new Object[] {category};
    Long count = db.queryForObject("SELECT COUNT(*) FROM transactions" + where, Long.class, args);
    BigDecimal total =
        db.queryForObject(
            "SELECT COALESCE(SUM(amount),0) FROM transactions" + where, BigDecimal.class, args);
    Map<String, BigDecimal> byCategory = new TreeMap<>();
    db.query(
        "SELECT category,SUM(amount) AS total FROM transactions" + where + " GROUP BY category",
        r -> {
          byCategory.put(r.getString("category"), r.getBigDecimal("total"));
        },
        args);
    return new Summary(count == null ? 0 : count, total, "CAD", byCategory);
  }

  private void validateCategory(String category) {
    if (category != null && !CATEGORIES.contains(category))
      throw new IllegalArgumentException("Unknown category");
  }
}
