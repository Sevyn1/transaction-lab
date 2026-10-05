package dev.favour.lab;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1"})
@AutoConfigureMockMvc
class ApiTest {
  @Autowired MockMvc mvc;
  @Autowired JdbcTemplate db;

  @BeforeEach
  void reset() {
    db.update("DELETE FROM transactions");
  }

  private String item(String id, String amount) {
    return "{\"externalId\":\""
        + id
        + "\",\"bookedOn\":\"2020-01-01\",\"merchant\":\"Demo"
        + " Shop\",\"category\":\"FOOD\",\"amount\":"
        + amount
        + ",\"currency\":\"CAD\"}";
  }

  private void create(String id, String amount) throws Exception {
    mvc.perform(
            post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(item(id, amount)))
        .andExpect(status().isCreated());
  }

  @Test
  void roundTripAndExactDecimalTotal() throws Exception {
    create("A", "0.10");
    create("B", "0.20");
    mvc.perform(get("/api/summary"))
        .andExpect(jsonPath("$.total").value(0.30))
        .andExpect(jsonPath("$.count").value(2));
    mvc.perform(get("/api/transactions").param("size", "1").param("page", "1"))
        .andExpect(jsonPath("$.items[0].externalId").value("A"))
        .andExpect(jsonPath("$.total").value(2));
  }

  @Test
  void duplicateIsConflict() throws Exception {
    create("A", "10");
    mvc.perform(
            post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(item("A", "10")))
        .andExpect(status().isConflict());
    mvc.perform(get("/api/summary")).andExpect(jsonPath("$.count").value(1));
  }

  @Test
  void zeroAndNegativeAreRejected() throws Exception {
    for (String amount : new String[] {"0", "-1"})
      mvc.perform(
              post("/api/transactions")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(item("A", amount)))
          .andExpect(status().isBadRequest());
  }

  @Test
  void ExcessPrecisionRejected() throws Exception {
    mvc.perform(
            post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(item("A", "1.001")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void badCategoryAndPagingRejected() throws Exception {
    mvc.perform(get("/api/transactions").param("category", "INVALID"))
        .andExpect(status().isBadRequest());
    mvc.perform(get("/api/transactions").param("size", "101")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/transactions").param("page", "-1")).andExpect(status().isBadRequest());
  }

  @Test
  void filterSummaryMatchesList() throws Exception {
    create("A", "10");
    mvc.perform(get("/api/summary").param("category", "SHOPPING"))
        .andExpect(jsonPath("$.total").value(0))
        .andExpect(jsonPath("$.count").value(0));
    mvc.perform(get("/api/transactions").param("category", "FOOD"))
        .andExpect(jsonPath("$.total").value(1));
  }

  @Test
  void malformedAndUnknownFieldsRejected() throws Exception {
    mvc.perform(
            post("/api/transactions").contentType(MediaType.APPLICATION_JSON).content("{broken"))
        .andExpect(status().isBadRequest());
    mvc.perform(
            post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(item("A", "10").replace("}", ",\"surprise\":true}")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void futureDateAndNonCadRejected() throws Exception {
    String input = item("A", "10").replace("2020-01-01", "2999-01-01").replace("CAD", "USD");
    mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON).content(input))
        .andExpect(status().isBadRequest());
  }
}
