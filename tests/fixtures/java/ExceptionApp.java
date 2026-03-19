public class ExceptionApp {
    public static void main(String[] args) {
        try {
            throw new RuntimeException("test error");
        } catch (Exception e) {
            System.out.println("caught: " + e.getMessage());
        }
    }
}
