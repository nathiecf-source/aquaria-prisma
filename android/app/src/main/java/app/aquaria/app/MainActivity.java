package app.aquaria.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Edge-to-edge (Android 15+/SDK 35): WebView desenha sob as barras do
    // sistema; o app compensa via env(safe-area-inset-*) no CSS.
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);
  }
}
