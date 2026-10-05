package dev.favour.lab;

import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TransactionController {
  private final TransactionService service;

  public TransactionController(TransactionService service) {
    this.service = service;
  }

  @GetMapping("/health")
  public java.util.Map<String, String> health() {
    return java.util.Map.of("status", "ok");
  }

  @GetMapping("/transactions")
  public TransactionService.Page list(
      @RequestParam(required = false) String category,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    return service.list(category, page, size);
  }

  @PostMapping("/transactions")
  public ResponseEntity<Transaction> create(@Valid @RequestBody TransactionInput input) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
  }

  @GetMapping("/summary")
  public TransactionService.Summary summary(@RequestParam(required = false) String category) {
    return service.summary(category);
  }
}
